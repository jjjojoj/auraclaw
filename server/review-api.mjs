import express from "express";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const ROOT = "/Users/joe/Documents/New project/auraclaw";
const HARVEST_DIR = path.join(ROOT, "content", "inbox", "source-harvest");
const REVIEW_DIR = path.join(ROOT, "content", "review");
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
  if (!fs.existsSync(REVIEW_STATE_FILE)) {
    fs.writeFileSync(REVIEW_STATE_FILE, JSON.stringify({ decisions: {} }, null, 2), "utf8");
  }
  if (!fs.existsSync(REVIEW_HISTORY_FILE)) {
    fs.writeFileSync(REVIEW_HISTORY_FILE, "", "utf8");
  }
}

function safeReadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
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

function normalizeCandidate(run, candidate, reviewState, reviewHistory) {
  const key = createCandidateKey(run.fileName, candidate);
  const currentDecision =
    reviewState.decisions[key] ?? {
      status: "pending",
      notes: "",
      reviewer: "",
      reviewedAt: "",
    };

  return {
    key,
    candidateId: candidate.id ?? "",
    runFileName: run.fileName,
    runAt: run.data.run_at ?? "",
    collector: run.data.collector ?? "",
    title: candidate.title ?? "",
    type: candidate.type ?? "source_note_candidate",
    sourceName: candidate.source_name ?? "",
    sourceUrl: candidate.source_url ?? "",
    contentType: candidate.content_type ?? "",
    boardFit: Array.isArray(candidate.board_fit) ? candidate.board_fit : [],
    whyItMatters: candidate.why_it_matters ?? "",
    oneLineSummary: candidate.one_line_summary ?? "",
    suggestedRecipeTitle: candidate.suggested_recipe_title ?? "",
    suggestedAngle: candidate.suggested_angle ?? "",
    confidence: candidate.confidence ?? "medium",
    needsManualReview: Boolean(candidate.needs_manual_review),
    status: currentDecision.status,
    notes: currentDecision.notes ?? "",
    reviewer: currentDecision.reviewer ?? "",
    reviewedAt: currentDecision.reviewedAt ?? "",
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
    for (const candidate of accepted) {
      candidates.push(normalizeCandidate(run, candidate, reviewState, reviewHistory));
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
  state.decisions[req.params.key] = {
    status,
    notes,
    reviewer,
    reviewedAt: now,
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
  });

  const refreshed = getAllCandidates().find((item) => item.key === req.params.key);
  res.json({ candidate: refreshed });
});

app.get("/api/review/summary", (_req, res) => {
  res.json(buildSummary(getAllCandidates()));
});

ensureReviewStorage();

app.listen(PORT, () => {
  console.log(`AuraClaw admin API listening on http://localhost:${PORT}`);
});
