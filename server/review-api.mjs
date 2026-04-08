import express from "express";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const ROOT = "/Users/joe/Documents/New project/auraclaw";
const HARVEST_DIR = path.join(ROOT, "content", "inbox", "source-harvest");
const REVIEW_DIR = path.join(ROOT, "content", "review");
const DRAFTS_DIR = path.join(REVIEW_DIR, "drafts");
const SOURCE_NOTE_DRAFT_DIR = path.join(DRAFTS_DIR, "source-notes");
const RECIPE_DRAFT_DIR = path.join(DRAFTS_DIR, "recipes");
const SNAPSHOTS_DIR = path.join(REVIEW_DIR, "snapshots");
const GENERATED_DIR = path.join(ROOT, "src", "generated");
const PUBLISHED_SOURCE_NOTES_FILE = path.join(GENERATED_DIR, "published-source-notes.json");
const PUBLISHED_RECIPES_FILE = path.join(GENERATED_DIR, "published-recipes.json");
const REVIEW_STATE_FILE = path.join(REVIEW_DIR, "state.json");
const REVIEW_HISTORY_FILE = path.join(REVIEW_DIR, "history.jsonl");

loadEnvFiles();

const PORT = Number(process.env.AURACLAW_REVIEW_PORT || 5174);
const ADMIN_USERNAME = requireEnv("AURACLAW_ADMIN_USERNAME");
const ADMIN_PASSWORD = requireEnv("AURACLAW_ADMIN_PASSWORD");
const SESSION_SECRET = requireEnv("AURACLAW_SESSION_SECRET");
const SESSION_COOKIE = "auraclaw_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCKOUT_MS = 30 * 60 * 1000;
const MAX_FAILED_LOGINS = 5;
const loginAttempts = new Map();

const app = express();

const VALID_STATUSES = new Set([
  "pending",
  "approved_source_note",
  "approved_recipe",
  "rejected",
  "archived",
]);
const VALID_BOARDS = new Set(["care", "extension", "dialogue", "opc"]);

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(["/api/admin", "/api/review"], (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

function loadEnvFiles() {
  const envFiles = [".env.local", ".env"].map((name) => path.join(ROOT, name));

  for (const filePath of envFiles) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      if (!key || process.env[key]) {
        continue;
      }

      process.env[key] = unwrapEnvValue(rawValue);
    }
  }
}

function unwrapEnvValue(rawValue) {
  if (
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
  ) {
    return rawValue.slice(1, -1);
  }
  return rawValue;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function ensureReviewStorage() {
  fs.mkdirSync(REVIEW_DIR, { recursive: true });
  fs.mkdirSync(SOURCE_NOTE_DRAFT_DIR, { recursive: true });
  fs.mkdirSync(RECIPE_DRAFT_DIR, { recursive: true });
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  if (!fs.existsSync(REVIEW_STATE_FILE)) {
    fs.writeFileSync(REVIEW_STATE_FILE, JSON.stringify({ decisions: {} }, null, 2), "utf8");
  }
  if (!fs.existsSync(REVIEW_HISTORY_FILE)) {
    fs.writeFileSync(REVIEW_HISTORY_FILE, "", "utf8");
  }
  if (!fs.existsSync(PUBLISHED_SOURCE_NOTES_FILE)) {
    fs.writeFileSync(PUBLISHED_SOURCE_NOTES_FILE, JSON.stringify({ items: [] }, null, 2), "utf8");
  }
  if (!fs.existsSync(PUBLISHED_RECIPES_FILE)) {
    fs.writeFileSync(PUBLISHED_RECIPES_FILE, JSON.stringify({ items: [] }, null, 2), "utf8");
  }
}

function safeReadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readPublishedStore(filePath) {
  const data = safeReadJson(filePath, { items: [] });
  if (!data || typeof data !== "object" || !Array.isArray(data.items)) {
    return { items: [] };
  }
  return data;
}

function writePublishedStore(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function readReviewState() {
  ensureReviewStorage();
  const state = safeReadJson(REVIEW_STATE_FILE, { decisions: {} });
  return state && typeof state === "object" && state.decisions ? state : { decisions: {} };
}

function writeReviewState(state) {
  fs.writeFileSync(REVIEW_STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

function readReviewHistory() {
  ensureReviewStorage();
  const raw = fs.readFileSync(REVIEW_HISTORY_FILE, "utf8");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function appendReviewHistory(entry) {
  fs.appendFileSync(REVIEW_HISTORY_FILE, `${JSON.stringify(entry)}\n`, "utf8");
}

function readYamlFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return yaml.load(content);
  } catch {
    return null;
  }
}

function slugifyFilePart(value) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "draft";
}

function sanitizeBoardFit(values, fallback) {
  const input = Array.isArray(values) ? values : fallback ? [fallback] : [];
  return input.filter((value) => typeof value === "string" && VALID_BOARDS.has(value));
}

function guessCandidateType(contentType) {
  return ["source_map", "guide", "tutorial"].includes(contentType)
    ? "source_note_candidate"
    : "recipe_candidate";
}

function mapScoreToConfidence(score) {
  if (score >= 0.8) return "high";
  if (score >= 0.55) return "medium";
  return "low";
}

function formatBoardName(board) {
  return {
    care: "产后护理",
    extension: "能力扩展",
    dialogue: "对话训练",
    opc: "一人公司（OPC）",
  }[board] || board;
}

function trimParagraph(value) {
  return String(value || "").trim();
}

function createDraftFrontmatter(fields) {
  return `---\n${yaml.dump(fields, { lineWidth: 120 }).trim()}\n---`;
}

function buildDraftFileName(candidate, status) {
  const preferredTitle =
    status === "approved_recipe"
      ? candidate.suggestedRecipeTitle || candidate.title
      : candidate.title;
  return `${candidate.key}-${slugifyFilePart(preferredTitle)}.md`;
}

function archiveExistingDraft(filePath, candidateKey, now, nextContent) {
  if (!fs.existsSync(filePath)) {
    return "";
  }

  const currentContent = fs.readFileSync(filePath, "utf8");
  if (currentContent === nextContent) {
    return "";
  }

  const snapshotDir = path.join(SNAPSHOTS_DIR, candidateKey);
  fs.mkdirSync(snapshotDir, { recursive: true });
  const stamp = now.replace(/[-:.TZ]/g, "").slice(0, 14);
  const snapshotPath = path.join(snapshotDir, `${stamp}-${path.basename(filePath)}`);
  fs.copyFileSync(filePath, snapshotPath);
  return snapshotPath;
}

function renderSourceNoteDraft(candidate, reviewer, notes, now) {
  const boardNames = sanitizeBoardFit(candidate.boardFit, "").map(formatBoardName);
  const frontmatter = createDraftFrontmatter({
    draftType: "source_note",
    candidateKey: candidate.key,
    candidateId: candidate.candidateId || "",
    generatedAt: now,
    reviewer,
    sourceName: candidate.sourceName,
    sourceUrl: candidate.sourceUrl,
    boardFit: candidate.boardFit,
    contentType: candidate.contentType || "guide",
    confidence: candidate.confidence || "medium",
    originLayer: candidate.originLayer,
  });

  const sections = [
    frontmatter,
    `# ${candidate.title || "未命名来源草稿"}`,
    "",
    "## 一句话摘要",
    trimParagraph(candidate.oneLineSummary || candidate.whyItMatters || "待补充这条来源的核心价值。"),
    "",
    "## 为什么值得收入 AuraClaw",
    trimParagraph(candidate.whyItMatters || "待补充这条来源能补足的内容空缺。"),
    "",
    "## 建议放入的板块",
    boardNames.length ? boardNames.map((item) => `- ${item}`).join("\n") : "- 待判断",
    "",
    "## 适合反哺的内容方向",
    trimParagraph(candidate.suggestedAngle || "待补充这条来源更适合反哺到哪个经验包或索引页。"),
    "",
    "## 建议站内标题",
    trimParagraph(candidate.suggestedRecipeTitle || candidate.title || "待定标题"),
    "",
    "## 原始来源",
    `- 站点：${candidate.sourceName || "未知来源"}`,
    `- 链接：${candidate.sourceUrl || "待补充"}`,
    `- 采集批次：${candidate.runFileName}`,
    `- 采集时间：${candidate.runAt || "未知"}`,
    "",
    "## 审核备注",
    trimParagraph(notes || "暂无备注"),
    "",
    "## 下一步补充",
    "- 核对正文是否和已有来源索引重复",
    "- 补上 3 到 5 条关键要点",
    "- 判断是否需要进一步改写成经验包",
    "",
  ];

  return sections.join("\n");
}

function renderRecipeDraft(candidate, reviewer, notes, now) {
  const recipeTitle = trimParagraph(candidate.suggestedRecipeTitle || candidate.title || "未命名经验包草稿");
  const boardNames = sanitizeBoardFit(candidate.boardFit, "").map(formatBoardName);
  const frontmatter = createDraftFrontmatter({
    draftType: "recipe",
    candidateKey: candidate.key,
    candidateId: candidate.candidateId || "",
    generatedAt: now,
    reviewer,
    sourceName: candidate.sourceName,
    sourceUrl: candidate.sourceUrl,
    boardFit: candidate.boardFit,
    contentType: candidate.contentType || "workflow",
    confidence: candidate.confidence || "medium",
    originLayer: candidate.originLayer,
  });

  const sections = [
    frontmatter,
    `# ${recipeTitle}`,
    "",
    "## 经验包定位",
    trimParagraph(candidate.oneLineSummary || "待补充这个经验包最终能帮用户做成什么。"),
    "",
    "## 为什么值得做",
    trimParagraph(candidate.whyItMatters || "待补充它对 AuraClaw 的价值。"),
    "",
    "## 建议包装方向",
    trimParagraph(candidate.suggestedAngle || "待补充这条内容更适合怎么包装成经验包。"),
    "",
    "## 适合板块",
    boardNames.length ? boardNames.map((item) => `- ${item}`).join("\n") : "- 待判断",
    "",
    "## 复制给 OpenClaw 之前要补齐的东西",
    "- 前置条件：待补",
    "- 依赖 / skill / 仓库：待补",
    "- 验证步骤：待补",
    "- 回退方式：待补",
    "",
    "## 可直接沿用的原始线索",
    `- 来源：${candidate.sourceName || "未知来源"}`,
    `- 链接：${candidate.sourceUrl || "待补充"}`,
    `- 采集批次：${candidate.runFileName}`,
    "",
    "## 审核备注",
    trimParagraph(notes || "暂无备注"),
    "",
    "## 下一步补充",
    "- 补真实输入示例",
    "- 补输出示意",
    "- 补验证 / 回退 / 风险说明",
    "",
  ];

  return sections.join("\n");
}

function writeDraftFile(candidate, status, notes, reviewer, now, previousDraft) {
  const baseDir = status === "approved_source_note" ? SOURCE_NOTE_DRAFT_DIR : RECIPE_DRAFT_DIR;
  const fileName = previousDraft?.type === status && previousDraft?.fileName
    ? previousDraft.fileName
    : buildDraftFileName(candidate, status);
  const filePath = path.join(baseDir, fileName);
  const content =
    status === "approved_source_note"
      ? renderSourceNoteDraft(candidate, reviewer, notes, now)
      : renderRecipeDraft(candidate, reviewer, notes, now);
  const snapshotPath = archiveExistingDraft(filePath, candidate.key, now, content);
  fs.writeFileSync(filePath, content, "utf8");

  return {
    type: status,
    filePath,
    fileName,
    updatedAt: now,
    snapshotPath,
  };
}

function listDraftSnapshots(candidateKey) {
  const snapshotDir = path.join(SNAPSHOTS_DIR, candidateKey);
  if (!fs.existsSync(snapshotDir)) {
    return [];
  }

  return fs
    .readdirSync(snapshotDir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .reverse()
    .map((name) => {
      const filePath = path.join(snapshotDir, name);
      const stats = fs.statSync(filePath);
      return {
        fileName: name,
        filePath,
        updatedAt: stats.mtime.toISOString(),
      };
    });
}

function buildPublicSlug(candidate) {
  const base = slugifyFilePart(candidate.suggestedRecipeTitle || candidate.title || "");
  if (!base || base === "draft") {
    return `recipe-${candidate.key}`;
  }
  return `${base}-${candidate.key.slice(0, 6)}`;
}

function buildPublishedSourceNote(candidate, notes, now) {
  const boardFit = sanitizeBoardFit(candidate.boardFit, "");
  const recommendedFor = candidate.suggestedRecipeTitle
    ? [candidate.suggestedRecipeTitle, ...boardFit.map(formatBoardName)]
    : boardFit.map(formatBoardName);

  return {
    id: `PUB-SRC-${candidate.key}`,
    title: candidate.title || "未命名来源",
    siteName: candidate.sourceName || "未知来源",
    sourceUrl: candidate.sourceUrl || "",
    contentType: candidate.contentType || "guide",
    boardFit,
    summary: trimParagraph(candidate.oneLineSummary || candidate.whyItMatters || "后台审核后发布的来源索引。"),
    keyPoints: [
      trimParagraph(candidate.whyItMatters || "待补充这条来源的关键价值。"),
      trimParagraph(candidate.suggestedAngle || "待补充这条来源最适合反哺的改写方向。"),
      `审核来源：${candidate.runFileName}`,
    ].filter(Boolean),
    recommendedFor: recommendedFor.filter(Boolean),
    newbieFriendly: boardFit.includes("care") || boardFit.includes("dialogue"),
    needsManualReview: false,
    citationMode: "structured_rewrite",
    reuseTargets: ["source_index", "recipe_page"],
    lastChecked: now.slice(0, 10),
    notes: trimParagraph(notes || `由后台于 ${now.slice(0, 10)} 发布。`),
  };
}

function buildPublishedRecipe(candidate, notes, now) {
  const boardFit = sanitizeBoardFit(candidate.boardFit, "extension");
  const trackId = boardFit[0] || "extension";
  const publicTitle = trimParagraph(candidate.suggestedRecipeTitle || candidate.title || "未命名经验包");
  const publicSlug = buildPublicSlug(candidate);

  return {
    id: `PUB-RCP-${candidate.key}`,
    slug: publicSlug,
    title: publicTitle,
    trackId,
    targetRoles: boardFit.map(formatBoardName),
    outcome: trimParagraph(candidate.oneLineSummary || `把“${publicTitle}”整理成一条可执行经验包。`),
    whyItMatters: trimParagraph(candidate.whyItMatters || "这条内容经过后台审核，适合继续打磨成正式经验包。"),
    prerequisites: [
      "先阅读这条经验包引用的原始来源",
      "确认你的 OpenClaw 当前具备执行这类任务的基础能力",
      "先在小范围里测试一次，再决定是否扩成长期工作流",
    ],
    riskLevel: trackId === "care" ? "低" : "中低",
    minutes: trackId === "opc" ? 18 : 12,
    testCase: trimParagraph(candidate.suggestedAngle || `先围绕“${publicTitle}”做一次最小可行验证。`),
    passCriteria: [
      "能说清这条经验包最终想帮用户做成什么",
      "能跑出一次可验证的最小结果",
      "能说明下一步还需要补哪些能力或素材",
    ],
    promise: trimParagraph(candidate.oneLineSummary || `这是一条由后台审核发布的基础版经验包：${publicTitle}`),
    copyBlock: `你现在要围绕“${publicTitle}”执行一条基础版 AuraClaw 经验包。\n\n目标\n- 先理解我要完成的事情\n- 再判断当前环境是否已经具备这条经验需要的能力\n- 最后给出一次最小可行结果和后续补齐建议\n\n背景线索\n- 来源：${candidate.sourceName || "未知来源"}\n- 原始链接：${candidate.sourceUrl || "待补充"}\n- 审核建议：${candidate.suggestedAngle || candidate.whyItMatters || "先根据来源内容整理执行步骤"}\n\n执行要求\n1. 先不要假装已经有所有能力；如果需要 skill、仓库或额外配置，请明确说出来。\n2. 先跑一版最小结果，不要一开始就扩成复杂自动化。\n3. 输出时告诉我：这次做成了什么、还缺什么、下一步最值得继续补什么。\n\n边界\n- 不要编造来源里没有的信息\n- 不要跳过验证\n- 不要直接把复杂自动化当成已经完成`,
    starterLabel: "后台发布",
    salesPitch: "这是一条通过审核后先上线的基础版经验包，方便继续在真实场景里补厚。",
    bestFor: [
      `想快速试跑“${publicTitle}”的人`,
      "希望先拿到基础版执行包，再慢慢补厚的人",
    ],
    prepareChecklist: [
      "先打开原始来源，确认这条经验与你当前目标一致",
      "准备一个最小测试案例，不要一开始就上真实生产数据",
      "如果需要 skill 或仓库，先让 OpenClaw 明确列出来",
    ],
    youWillGet: [
      "一版基础执行包",
      "一次最小可行结果",
      "后续补能力或补内容的建议",
    ],
    experienceIncludes: [
      "目标判断",
      "能力缺口判断",
      "最小执行结果",
      "后续补齐建议",
    ],
    executionFlow: [
      "先读原始来源和审核建议，判断这条经验真正要完成的事。",
      "再判断当前 OpenClaw 是否已经具备需要的能力；如果没有，先列能力缺口。",
      "先跑一版最小结果，再说明下一步怎么补成更完整的经验包。",
    ],
    dependencies: [
      {
        name: candidate.sourceName || "原始来源",
        kind: "审核来源",
        source: candidate.sourceUrl || "",
        summary: trimParagraph(candidate.whyItMatters || candidate.oneLineSummary || "后台审核通过的来源。"),
      },
    ],
    sampleInput: {
      title: "建议你先用一个最小案例测试",
      content: `请先围绕“${publicTitle}”跑一个最小案例。\n如果你发现缺少 skill、仓库或平台接入，请先告诉我缺什么，再继续。`,
    },
    outputPreview: `本次最小结果\n- 已完成：${candidate.oneLineSummary || "待补充"}\n- 还缺：待补充具体能力或素材\n- 下一步：继续补厚这条经验包`,
    pitfalls: [
      {
        issue: "一开始就把基础版经验包当成完整自动化",
        fix: "先跑通最小结果，再决定要不要接长期调度或多步骤工作流。",
      },
      {
        issue: "来源线索还不够，却直接要求 OpenClaw 一步到位",
        fix: "先让 OpenClaw 说明还缺哪些能力、素材或配置，再继续扩展。",
      },
    ],
    shortestCommand: `先围绕“${publicTitle}”做一个最小可行结果。`,
    validationSteps: [
      "确认 OpenClaw 没有跳过能力判断",
      "确认先交付了一次最小结果",
      "确认最后给出了下一步补齐建议",
    ],
    fallbackPlan: [
      "如果一次结果太散，先缩到一个更小的测试案例",
      "如果能力不够，先补 skill / 仓库 / 平台接入，再重新执行",
    ],
    sourceTips: [
      `来源：${candidate.sourceName || "未知来源"}`,
      `原始链接：${candidate.sourceUrl || "待补充"}`,
      trimParagraph(notes || "这条经验包来自后台审核发布。"),
    ],
    nextStep: trackId === "opc" ? "继续补成一条可长期运行的工作骨架。" : "继续补真实输入示例、验证步骤和回退方案。",
  };
}

function publishCandidate(candidate, status, notes, now, previousPublished) {
  if (status === "approved_source_note") {
    const store = readPublishedStore(PUBLISHED_SOURCE_NOTES_FILE);
    const note = buildPublishedSourceNote(candidate, notes, now);
    const item = {
      candidateKey: candidate.key,
      publishedAt: now,
      publicPath: "/sources",
      note,
    };
    store.items = store.items.filter((entry) => entry.candidateKey !== candidate.key);
    store.items.unshift(item);
    writePublishedStore(PUBLISHED_SOURCE_NOTES_FILE, store);
    return {
      type: status,
      filePath: PUBLISHED_SOURCE_NOTES_FILE,
      fileName: path.basename(PUBLISHED_SOURCE_NOTES_FILE),
      publishedAt: now,
      publicPath: "/sources",
      snapshotPath: previousPublished?.filePath ?? "",
    };
  }

  const store = readPublishedStore(PUBLISHED_RECIPES_FILE);
  const recipe = buildPublishedRecipe(candidate, notes, now);
  const item = {
    candidateKey: candidate.key,
    publishedAt: now,
    publicPath: `/recipes/${recipe.slug}`,
    recipe,
  };
  store.items = store.items.filter((entry) => entry.candidateKey !== candidate.key);
  store.items.unshift(item);
  writePublishedStore(PUBLISHED_RECIPES_FILE, store);
  return {
    type: status,
    filePath: PUBLISHED_RECIPES_FILE,
    fileName: path.basename(PUBLISHED_RECIPES_FILE),
    publishedAt: now,
    publicPath: `/recipes/${recipe.slug}`,
    snapshotPath: previousPublished?.filePath ?? "",
  };
}

function unpublishCandidate(candidate, published) {
  if (!published) {
    return;
  }

  const targetFile =
    published.type === "approved_source_note" ? PUBLISHED_SOURCE_NOTES_FILE : PUBLISHED_RECIPES_FILE;
  const store = readPublishedStore(targetFile);
  store.items = store.items.filter((entry) => entry.candidateKey !== candidate.key);
  writePublishedStore(targetFile, store);
}

function listHarvestRuns() {
  if (!fs.existsSync(HARVEST_DIR)) {
    return [];
  }

  return fs
    .readdirSync(HARVEST_DIR)
    .filter((name) => name.endsWith(".yaml") || name.endsWith(".yml"))
    .sort()
    .reverse()
    .map((name) => {
      const filePath = path.join(HARVEST_DIR, name);
      const data = readYamlFile(filePath);
      if (!data || typeof data !== "object") {
        return null;
      }
      return {
        fileName: name,
        filePath,
        data,
      };
    })
    .filter(Boolean);
}

function createCandidateKey(runFileName, candidate) {
  const basis = `${runFileName}::${candidate.id || ""}::${candidate.source_url || ""}::${candidate.title || ""}`;
  return createHash("sha1").update(basis).digest("hex").slice(0, 16);
}

function normalizeCandidate(run, candidate, reviewState, reviewHistory, originLayer = "accepted") {
  const key = createCandidateKey(run.fileName, candidate);
  const currentDecision =
    reviewState.decisions[key] ?? {
      status: "pending",
      notes: "",
      reviewer: "",
      reviewedAt: "",
      draft: null,
      published: null,
    };
  const contentType = candidate.content_type ?? "";
  const boardFit = sanitizeBoardFit(candidate.board_fit, candidate.board_fit_guess);
  const qualityScore = Number(candidate.quality_scores?.total_score ?? 0);
  const confidence =
    candidate.confidence ??
    (originLayer === "prefiltered" ? mapScoreToConfidence(qualityScore) : "medium");
  const type = candidate.type ?? guessCandidateType(contentType);
  const oneLineSummary =
    candidate.one_line_summary ??
    candidate.summary ??
    "";
  const whyItMatters =
    candidate.why_it_matters ??
    (originLayer === "prefiltered"
      ? `来自 ${candidate.source_name || "未知来源"} 的预筛候选，等待人工补充“为什么值得收”。`
      : "");
  const suggestedRecipeTitle =
    candidate.suggested_recipe_title ??
    (originLayer === "prefiltered" && type === "recipe_candidate" ? candidate.title ?? "" : "");
  const suggestedAngle =
    candidate.suggested_angle ??
    (candidate.novelty_reason ? `预筛提示：${candidate.novelty_reason}` : "");

  return {
    key,
    candidateId: candidate.id ?? "",
    runFileName: run.fileName,
    runAt: run.data.run_at ?? "",
    collector: run.data.collector ?? "",
    originLayer,
    title: candidate.title ?? "",
    type,
    sourceName: candidate.source_name ?? "",
    sourceUrl: candidate.source_url ?? "",
    contentType,
    boardFit,
    whyItMatters,
    oneLineSummary,
    suggestedRecipeTitle,
    suggestedAngle,
    confidence,
    needsManualReview: originLayer === "prefiltered" ? true : Boolean(candidate.needs_manual_review),
    status: currentDecision.status,
    notes: currentDecision.notes ?? "",
    reviewer: currentDecision.reviewer ?? "",
    reviewedAt: currentDecision.reviewedAt ?? "",
    draft: currentDecision.draft ?? null,
    published: currentDecision.published ?? null,
    history: reviewHistory.filter((entry) => entry.candidateKey === key),
  };
}

function getAllCandidates() {
  const runs = listHarvestRuns();
  const reviewState = readReviewState();
  const reviewHistory = readReviewHistory();
  const candidates = [];

  for (const run of runs) {
    const accepted = Array.isArray(run.data.accepted_candidates) ? run.data.accepted_candidates : [];
    const prefiltered = Array.isArray(run.data.prefiltered_candidates) ? run.data.prefiltered_candidates : [];

    for (const candidate of accepted) {
      candidates.push(normalizeCandidate(run, candidate, reviewState, reviewHistory, "accepted"));
    }

    if (accepted.length === 0 && prefiltered.length > 0) {
      for (const candidate of prefiltered) {
        candidates.push(normalizeCandidate(run, candidate, reviewState, reviewHistory, "prefiltered"));
      }
    }
  }

  return candidates.sort((a, b) => {
    const timeA = new Date(a.runAt || 0).getTime();
    const timeB = new Date(b.runAt || 0).getTime();
    return timeB - timeA;
  });
}

function buildSummary(candidates) {
  const counts = {
    pending: 0,
    approved_source_note: 0,
    approved_recipe: 0,
    rejected: 0,
    archived: 0,
  };

  for (const candidate of candidates) {
    if (candidate.status in counts) {
      counts[candidate.status] += 1;
    }
  }

  return {
    totalCandidates: candidates.length,
    counts,
    latestRunAt: candidates[0]?.runAt ?? "",
  };
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest();
}

function safeEqualText(left, right) {
  return timingSafeEqual(sha256Text(left), sha256Text(right));
}

function signValue(value) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function createSessionToken(username) {
  const payload = {
    username,
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
    nonce: randomBytes(12).toString("hex"),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${signValue(encodedPayload)}`;
}

function verifySessionToken(token) {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".", 2);
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  if (!safeEqualText(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (
      !payload ||
      typeof payload.username !== "string" ||
      typeof payload.issuedAt !== "number" ||
      typeof payload.expiresAt !== "number"
    ) {
      return null;
    }

    if (payload.expiresAt <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce((accumulator, chunk) => {
    const [rawKey, ...rawValueParts] = chunk.trim().split("=");
    if (!rawKey) {
      return accumulator;
    }

    accumulator[rawKey] = decodeURIComponent(rawValueParts.join("=") || "");
    return accumulator;
  }, {});
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  parts.push(`Path=${options.path || "/"}`);
  parts.push("HttpOnly");
  parts.push("SameSite=Strict");
  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE, token, {
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
      path: "/",
      secure: process.env.NODE_ENV === "production",
    }),
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE, "", {
      maxAge: 0,
      path: "/",
      secure: process.env.NODE_ENV === "production",
    }),
  );
}

function getSessionFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  return verifySessionToken(token);
}

function buildSessionResponse(session) {
  return {
    username: session.username,
    authenticatedAt: new Date(session.issuedAt).toISOString(),
    expiresAt: new Date(session.expiresAt).toISOString(),
  };
}

function getClientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function getAttemptsRecord(clientKey) {
  const existing = loginAttempts.get(clientKey) ?? {
    failures: [],
    lockedUntil: 0,
  };

  const now = Date.now();
  const cutoff = now - LOGIN_WINDOW_MS;
  existing.failures = existing.failures.filter((timestamp) => timestamp > cutoff);

  if (existing.lockedUntil && existing.lockedUntil <= now) {
    existing.lockedUntil = 0;
  }

  loginAttempts.set(clientKey, existing);
  return existing;
}

function recordFailedLogin(clientKey) {
  const record = getAttemptsRecord(clientKey);
  record.failures.push(Date.now());

  if (record.failures.length >= MAX_FAILED_LOGINS) {
    record.failures = [];
    record.lockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
  }

  loginAttempts.set(clientKey, record);
  return record;
}

function clearFailedLogins(clientKey) {
  loginAttempts.delete(clientKey);
}

function requireAdminAuth(req, res, next) {
  const session = getSessionFromRequest(req);
  if (!session) {
    clearSessionCookie(res);
    res.status(401).json({ error: "Admin authentication required" });
    return;
  }

  req.adminSession = session;
  next();
}

app.get("/api/admin/session", (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    clearSessionCookie(res);
    res.json({ authenticated: false });
    return;
  }

  res.json({
    authenticated: true,
    session: buildSessionResponse(session),
  });
});

app.post("/api/admin/login", (req, res) => {
  const clientKey = getClientKey(req);
  const attempts = getAttemptsRecord(clientKey);

  if (attempts.lockedUntil > Date.now()) {
    res.status(429).json({
      error: "登录尝试过多，已临时锁定。",
      lockedUntil: new Date(attempts.lockedUntil).toISOString(),
      attemptsRemaining: 0,
    });
    return;
  }

  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!username || !password) {
    res.status(400).json({ error: "请输入后台用户名和密码。" });
    return;
  }

  const validUsername = safeEqualText(username, ADMIN_USERNAME);
  const validPassword = safeEqualText(password, ADMIN_PASSWORD);

  if (!validUsername || !validPassword) {
    const updated = recordFailedLogin(clientKey);
    const attemptsRemaining =
      updated.lockedUntil > Date.now() ? 0 : Math.max(MAX_FAILED_LOGINS - updated.failures.length, 0);

    res.status(updated.lockedUntil > Date.now() ? 429 : 401).json({
      error:
        updated.lockedUntil > Date.now()
          ? "登录尝试过多，已临时锁定。"
          : "用户名或密码错误。",
      lockedUntil:
        updated.lockedUntil > Date.now() ? new Date(updated.lockedUntil).toISOString() : undefined,
      attemptsRemaining,
    });
    return;
  }

  clearFailedLogins(clientKey);
  const token = createSessionToken(ADMIN_USERNAME);
  const session = verifySessionToken(token);
  setSessionCookie(res, token);

  res.json({
    ok: true,
    session: buildSessionResponse(session || {
      username: ADMIN_USERNAME,
      issuedAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS,
    }),
  });
});

app.post("/api/admin/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.use("/api/review", requireAdminAuth);

app.get("/api/review/candidates", (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const board = typeof req.query.board === "string" ? req.query.board : "";
  const type = typeof req.query.type === "string" ? req.query.type : "";
  const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";

  let candidates = getAllCandidates();

  if (status && status !== "all") {
    candidates = candidates.filter((candidate) => candidate.status === status);
  }

  if (board && board !== "all") {
    candidates = candidates.filter((candidate) => candidate.boardFit.includes(board));
  }

  if (type && type !== "all") {
    candidates = candidates.filter((candidate) => candidate.type === type);
  }

  if (q) {
    candidates = candidates.filter((candidate) =>
      [
        candidate.title,
        candidate.sourceName,
        candidate.oneLineSummary,
        candidate.suggestedRecipeTitle,
        candidate.sourceUrl,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  res.json({
    summary: buildSummary(getAllCandidates()),
    candidates,
  });
});

app.get("/api/review/candidates/:key/history", (req, res) => {
  const candidates = getAllCandidates();
  const candidate = candidates.find((item) => item.key === req.params.key);
  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }
  res.json({ history: candidate.history });
});

app.get("/api/review/candidates/:key/draft", (req, res) => {
  const candidates = getAllCandidates();
  const candidate = candidates.find((item) => item.key === req.params.key);
  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  const draft = candidate.draft;
  if (!draft?.filePath || !fs.existsSync(draft.filePath)) {
    res.status(404).json({ error: "Draft not found" });
    return;
  }

  const content = fs.readFileSync(draft.filePath, "utf8");
  res.json({
    draft: {
      ...draft,
      content,
      snapshots: listDraftSnapshots(candidate.key),
    },
  });
});

app.post("/api/review/candidates/:key/publish", (req, res) => {
  const candidates = getAllCandidates();
  const candidate = candidates.find((item) => item.key === req.params.key);
  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  if (candidate.status !== "approved_source_note" && candidate.status !== "approved_recipe") {
    res.status(400).json({ error: "Only approved drafts can be published" });
    return;
  }

  if (!candidate.draft?.filePath || !fs.existsSync(candidate.draft.filePath)) {
    res.status(400).json({ error: "Draft not found. Please approve again to regenerate the draft." });
    return;
  }

  const now = new Date().toISOString();
  const reviewer = req.adminSession?.username || ADMIN_USERNAME;
  const state = readReviewState();
  const previousDecision = state.decisions[req.params.key] ?? null;
  const published = publishCandidate(
    candidate,
    candidate.status,
    candidate.notes,
    now,
    previousDecision?.published,
  );

  state.decisions[req.params.key] = {
    ...(previousDecision ?? {}),
    status: candidate.status,
    notes: candidate.notes,
    reviewer,
    reviewedAt: previousDecision?.reviewedAt ?? now,
    draft: candidate.draft,
    published,
  };
  writeReviewState(state);

  appendReviewHistory({
    candidateKey: req.params.key,
    candidateId: candidate.candidateId,
    title: candidate.title,
    status: candidate.status,
    notes: `发布到前台：${published.publicPath}`,
    reviewer,
    reviewedAt: now,
    runFileName: candidate.runFileName,
    sourceUrl: candidate.sourceUrl,
    draftFilePath: candidate.draft?.filePath ?? "",
    draftType: candidate.draft?.type,
    publishedFilePath: published.filePath,
    publicPath: published.publicPath,
  });

  const refreshed = getAllCandidates().find((item) => item.key === req.params.key);
  res.json({ candidate: refreshed, published });
});

app.post("/api/review/candidates/:key/unpublish", (req, res) => {
  const candidates = getAllCandidates();
  const candidate = candidates.find((item) => item.key === req.params.key);
  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  if (!candidate.published) {
    res.status(400).json({ error: "Candidate is not published" });
    return;
  }

  const now = new Date().toISOString();
  const reviewer = req.adminSession?.username || ADMIN_USERNAME;
  const state = readReviewState();
  const previousDecision = state.decisions[req.params.key] ?? null;
  const previousPublished = previousDecision?.published ?? candidate.published;

  unpublishCandidate(candidate, previousPublished);

  state.decisions[req.params.key] = {
    ...(previousDecision ?? {}),
    status: candidate.status,
    notes: candidate.notes,
    reviewer: previousDecision?.reviewer ?? reviewer,
    reviewedAt: previousDecision?.reviewedAt ?? now,
    draft: previousDecision?.draft ?? candidate.draft ?? null,
    published: null,
  };
  writeReviewState(state);

  appendReviewHistory({
    candidateKey: req.params.key,
    candidateId: candidate.candidateId,
    title: candidate.title,
    status: candidate.status,
    notes: `已撤回发布：${previousPublished.publicPath}`,
    reviewer,
    reviewedAt: now,
    runFileName: candidate.runFileName,
    sourceUrl: candidate.sourceUrl,
    draftFilePath: candidate.draft?.filePath ?? "",
    draftType: candidate.draft?.type,
    publishedFilePath: previousPublished.filePath,
    publicPath: previousPublished.publicPath,
  });

  const refreshed = getAllCandidates().find((item) => item.key === req.params.key);
  res.json({ candidate: refreshed });
});

app.post("/api/review/candidates/:key/decision", (req, res) => {
  const status = typeof req.body?.status === "string" ? req.body.status : "";
  const notes = typeof req.body?.notes === "string" ? req.body.notes : "";
  const reviewer = req.adminSession?.username || ADMIN_USERNAME;

  if (!VALID_STATUSES.has(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const candidates = getAllCandidates();
  const candidate = candidates.find((item) => item.key === req.params.key);

  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  const now = new Date().toISOString();
  const state = readReviewState();
  const previousDecision = state.decisions[req.params.key] ?? null;
  let draft = previousDecision?.draft ?? null;
  let published = previousDecision?.published ?? null;

  if (status === "approved_source_note" || status === "approved_recipe") {
    draft = writeDraftFile(candidate, status, notes, reviewer, now, previousDecision?.draft);
  } else if ((status === "rejected" || status === "archived") && previousDecision?.published) {
    unpublishCandidate(candidate, previousDecision.published);
    published = null;
  }

  state.decisions[req.params.key] = {
    status,
    notes,
    reviewer,
    reviewedAt: now,
    draft,
    published,
  };
  writeReviewState(state);

  appendReviewHistory({
    candidateKey: req.params.key,
    candidateId: candidate.candidateId,
    title: candidate.title,
    status,
    notes,
    reviewer,
    reviewedAt: now,
    runFileName: candidate.runFileName,
    sourceUrl: candidate.sourceUrl,
    draftFilePath: draft?.filePath ?? "",
    draftType: draft?.type,
    draftSnapshotPath: draft?.snapshotPath ?? "",
    publishedFilePath: published?.filePath ?? "",
    publicPath: published?.publicPath ?? "",
  });

  const refreshed = getAllCandidates().find((item) => item.key === req.params.key);
  res.json({ candidate: refreshed, draft });
});

app.get("/api/review/summary", (_req, res) => {
  res.json(buildSummary(getAllCandidates()));
});

ensureReviewStorage();

app.listen(PORT, () => {
  console.log(`AuraClaw admin API listening on http://localhost:${PORT}`);
});
