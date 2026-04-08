import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCheck,
  Clock3,
  FileStack,
  Pin,
  PinOff,
  RotateCcw,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { SectionHeading } from "@/components/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminSession, ReviewCandidate, ReviewStatus, ReviewSummary, TrackId } from "@/types";

const statusOptions: Array<{ value: ReviewStatus | "all"; label: string }> = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待审核" },
  { value: "approved_source_note", label: "已批为来源" },
  { value: "approved_recipe", label: "已批为经验包" },
  { value: "rejected", label: "已拒绝" },
  { value: "archived", label: "已归档" },
];

const boardOptions: Array<{ value: TrackId | "all"; label: string }> = [
  { value: "all", label: "全部板块" },
  { value: "care", label: "产后护理" },
  { value: "extension", label: "能力扩展" },
  { value: "dialogue", label: "对话训练" },
  { value: "opc", label: "一人公司" },
];

const statusLabel: Record<ReviewStatus, string> = {
  pending: "待审核",
  approved_source_note: "已批为来源",
  approved_recipe: "已批为经验包",
  rejected: "已拒绝",
  archived: "已归档",
};

interface DraftPreview {
  filePath: string;
  fileName: string;
  updatedAt: string;
  content: string;
  snapshots?: Array<{
    fileName: string;
    filePath: string;
    updatedAt: string;
  }>;
}

function formatTime(value: string) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

function reviewStatCard(label: string, value: number, icon: ReactNode) {
  return (
    <div className="border border-[color:var(--border)] bg-[color:var(--panel)] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">{label}</p>
          <p className="font-serif text-3xl tracking-[-0.03em]">{value}</p>
        </div>
        <span className="text-[color:var(--muted-foreground)]">{icon}</span>
      </div>
    </div>
  );
}

export function ReviewPage() {
  const session = useOutletContext<AdminSession>();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [candidates, setCandidates] = useState<ReviewCandidate[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("pending");
  const [boardFilter, setBoardFilter] = useState<TrackId | "all">("all");
  const [query, setQuery] = useState("");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [unpublishReasonDraft, setUnpublishReasonDraft] = useState<Record<string, string>>({});
  const [draftPreviews, setDraftPreviews] = useState<Record<string, DraftPreview | null>>({});
  const [draftLoadingKey, setDraftLoadingKey] = useState("");
  const [savingKey, setSavingKey] = useState<string>("");
  const [publishingKey, setPublishingKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCandidates() {
    setLoading(true);
    setError("");

    const search = new URLSearchParams();
    if (statusFilter) search.set("status", statusFilter);
    if (boardFilter) search.set("board", boardFilter);
    if (query.trim()) search.set("q", query.trim());

    try {
      const response = await fetch(`/api/review/candidates?${search.toString()}`);
      if (response.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }
      if (!response.ok) throw new Error("审核接口不可用");
      const data = await response.json();
      setCandidates(data.candidates ?? []);
      setSummary(data.summary ?? null);
      setDraftPreviews({});
      setNotesDraft((current) => {
        const next = { ...current };
        for (const candidate of data.candidates ?? []) {
          if (!(candidate.key in next)) {
            next[candidate.key] = candidate.notes ?? "";
          }
        }
        return next;
      });
      setUnpublishReasonDraft((current) => {
        const next = { ...current };
        for (const candidate of data.candidates ?? []) {
          if (!(candidate.key in next)) {
            next[candidate.key] = candidate.lastUnpublishReason ?? "";
          }
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCandidates();
  }, [boardFilter, navigate, statusFilter]);

  async function submitDecision(candidate: ReviewCandidate, status: ReviewStatus) {
    setSavingKey(candidate.key);
    setError("");

    try {
      const response = await fetch(`/api/review/candidates/${candidate.key}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          notes: notesDraft[candidate.key] ?? "",
        }),
      });
      if (response.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }
      if (!response.ok) throw new Error("保存审核结果失败");
      await loadCandidates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSavingKey("");
    }
  }

  async function toggleDraftPreview(candidate: ReviewCandidate) {
    if (draftPreviews[candidate.key]) {
      setDraftPreviews((current) => ({ ...current, [candidate.key]: null }));
      return;
    }

    setDraftLoadingKey(candidate.key);
    setError("");

    try {
      const response = await fetch(`/api/review/candidates/${candidate.key}/draft`);
      if (response.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }
      if (!response.ok) throw new Error("草稿预览读取失败");
      const data = await response.json();
      setDraftPreviews((current) => ({
        ...current,
        [candidate.key]: data.draft ?? null,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取草稿失败");
    } finally {
      setDraftLoadingKey("");
    }
  }

  async function publishCandidate(candidate: ReviewCandidate) {
    setPublishingKey(candidate.key);
    setError("");

    try {
      const response = await fetch(`/api/review/candidates/${candidate.key}/publish`, {
        method: "POST",
      });
      if (response.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }
      if (!response.ok) throw new Error("发布到前台失败");
      await loadCandidates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "发布失败");
    } finally {
      setPublishingKey("");
    }
  }

  async function unpublishCandidate(candidate: ReviewCandidate) {
    const reason = (unpublishReasonDraft[candidate.key] ?? "").trim();
    if (!reason) {
      setError("撤回发布前请先填写下线原因。");
      return;
    }

    setPublishingKey(candidate.key);
    setError("");

    try {
      const response = await fetch(`/api/review/candidates/${candidate.key}/unpublish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (response.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }
      if (!response.ok) throw new Error("撤回发布失败");
      await loadCandidates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "撤回失败");
    } finally {
      setPublishingKey("");
    }
  }

  async function runPublishControl(
    candidate: ReviewCandidate,
    action: "move_up" | "move_down" | "pin" | "unpin",
  ) {
    setPublishingKey(candidate.key);
    setError("");

    try {
      const response = await fetch(`/api/review/candidates/${candidate.key}/publish-controls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (response.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }
      if (!response.ok) throw new Error("更新前台排序失败");
      await loadCandidates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败");
    } finally {
      setPublishingKey("");
    }
  }

  return (
    <AdminLayout
      username={session.username}
      title="内容审核与回溯"
      intro="OpenClaw 只负责投递。这里只给管理员审核、改判和追溯。"
    >
      <section className="pt-16 sm:pt-24">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="eyebrow mb-5">Admin Review</p>
            <h1 className="font-serif text-4xl leading-[1.06] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              你来决定什么可以上线
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[color:var(--muted-foreground)]">
              OpenClaw 只负责侦察和投递。这里负责批准、拒绝、归档和回溯。原始采集文件不会被覆盖，审核动作会保留完整历史。
            </p>
          </div>

          <div className="grid gap-px bg-[color:var(--border)]">
            {reviewStatCard("总候选数", summary?.totalCandidates ?? 0, <FileStack className="h-5 w-5" />)}
            {reviewStatCard("待审核", summary?.counts.pending ?? 0, <Clock3 className="h-5 w-5" />)}
            {reviewStatCard("已批准", (summary?.counts.approved_source_note ?? 0) + (summary?.counts.approved_recipe ?? 0), <CheckCheck className="h-5 w-5" />)}
          </div>
        </div>
      </section>

      <section className="section-space">
        <SectionHeading
          eyebrow="筛选器"
          title="先缩小范围，再做判断"
          body="推荐先处理待审核，再逐步看已批准和已拒绝内容。"
        />

        <div className="mt-8 space-y-6 border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <label className="flex items-center gap-3 border border-[color:var(--border)] px-4 py-3">
              <Search className="h-4 w-4 text-[color:var(--muted-foreground)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void loadCandidates();
                  }
                }}
                placeholder="按标题、来源、建议题目搜索"
                className="w-full border-0 bg-transparent text-sm outline-none"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ReviewStatus | "all")}
              className="border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={boardFilter}
              onChange={(event) => setBoardFilter(event.target.value as TrackId | "all")}
              className="border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm outline-none"
            >
              {boardOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void loadCandidates()} className="rounded-full px-5">
              刷新候选内容
            </Button>
            <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
              最新采集时间：{summary?.latestRunAt ? formatTime(summary.latestRunAt) : "暂无"}
            </p>
          </div>

          {error ? (
            <div className="flex items-start gap-3 border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-4 py-3 text-sm text-[color:var(--foreground)]">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--care)]" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section-space">
        <SectionHeading
          eyebrow="候选内容"
          title={loading ? "正在读取审核队列" : `当前候选内容 ${candidates.length} 条`}
          body="每条内容都可以直接批准、拒绝、归档，也可以随时改判。"
        />

        <div className="mt-10 space-y-6">
          {!loading && candidates.length === 0 ? (
            <div className="border border-[color:var(--border)] bg-[color:var(--panel)] p-8 text-sm leading-7 text-[color:var(--muted-foreground)]">
              这一筛选条件下还没有候选内容。
            </div>
          ) : null}

          {candidates.map((candidate) => (
            <article key={candidate.key} className="border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="eyebrow">{candidate.sourceName}</span>
                    <Badge variant="accent">{statusLabel[candidate.status]}</Badge>
                    <span className="inline-flex items-center rounded-sm border border-[color:var(--border)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]">
                      {candidate.originLayer === "prefiltered" ? "预筛候选" : "GLM 通过"}
                    </span>
                    <span className="inline-flex items-center rounded-sm border border-[color:var(--border-strong)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]">
                      {candidate.type}
                    </span>
                    <span className="inline-flex items-center rounded-sm border border-[color:var(--border)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]">
                      {candidate.contentType}
                    </span>
                  </div>

                  <div>
                    <h2 className="font-serif text-3xl leading-snug tracking-[-0.02em] text-[color:var(--foreground)]">
                      {candidate.title || "未解析标题"}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--muted-foreground)]">
                      {candidate.oneLineSummary || candidate.whyItMatters}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs leading-6 text-[color:var(--muted-foreground)]">
                  <p>来源批次：{candidate.runFileName}</p>
                  <p>采集时间：{formatTime(candidate.runAt)}</p>
                  <p>信心：{candidate.confidence}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div>
                    <p className="eyebrow mb-2">为什么值得看</p>
                    <p className="text-sm leading-7 text-[color:var(--foreground)]">{candidate.whyItMatters || "暂无"}</p>
                  </div>

                  <div>
                    <p className="eyebrow mb-2">建议改写方向</p>
                    <p className="text-sm leading-7 text-[color:var(--foreground)]">
                      {candidate.suggestedRecipeTitle || "暂无建议题目"}
                      {candidate.suggestedAngle ? ` · ${candidate.suggestedAngle}` : ""}
                    </p>
                  </div>

                  <div>
                    <p className="eyebrow mb-2">适合板块</p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.boardFit.map((board) => (
                        <span
                          key={`${candidate.key}-${board}`}
                          className="inline-flex items-center rounded-sm border border-[color:var(--border-strong)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]"
                        >
                          {board}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[color:var(--border)] pt-4">
                    <a
                      href={candidate.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-[color:var(--foreground)] underline-offset-4 hover:underline"
                    >
                      打开原始来源
                    </a>
                  </div>

                  {candidate.draft ? (
                    <div className="border-t border-[color:var(--border)] pt-4">
                      <p className="eyebrow mb-2">已生成草稿</p>
                      <div className="space-y-2 text-sm leading-7 text-[color:var(--foreground)]">
                        <p>{candidate.draft.fileName}</p>
                        <p className="text-[color:var(--muted-foreground)]">{candidate.draft.filePath}</p>
                        <p className="text-[color:var(--muted-foreground)]">
                          最近生成：{formatTime(candidate.draft.updatedAt)}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full"
                          disabled={draftLoadingKey === candidate.key}
                          onClick={() => void toggleDraftPreview(candidate)}
                        >
                          {draftPreviews[candidate.key] ? "收起草稿预览" : "查看草稿预览"}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {candidate.published ? (
                    <div className="border-t border-[color:var(--border)] pt-4">
                      <p className="eyebrow mb-2">已发布到前台</p>
                      <div className="space-y-2 text-sm leading-7 text-[color:var(--foreground)]">
                        <p>{candidate.published.fileName}</p>
                        <p className="text-[color:var(--muted-foreground)]">{candidate.published.filePath}</p>
                        <p className="text-[color:var(--muted-foreground)]">
                          发布时间：{formatTime(candidate.published.publishedAt)}
                        </p>
                        <p className="text-[color:var(--muted-foreground)]">
                          前台排序：第 {candidate.published.position ?? "?"} 位
                          {candidate.published.pinned ? " · 已置顶" : " · 普通排序"}
                        </p>
                        <p className="text-[color:var(--muted-foreground)]">
                          公开路径：{candidate.published.publicPath}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {candidate.lastUnpublishReason ? (
                    <div className="border-t border-[color:var(--border)] pt-4">
                      <p className="eyebrow mb-2">最近一次下线记录</p>
                      <div className="space-y-2 text-sm leading-7 text-[color:var(--foreground)]">
                        <p>{candidate.lastUnpublishReason}</p>
                        <p className="text-[color:var(--muted-foreground)]">
                          下线时间：{formatTime(candidate.lastUnpublishedAt || "")}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4 border border-[color:var(--border)] bg-[color:var(--panel-muted)] p-4">
                  <div>
                    <p className="eyebrow mb-2">审核备注</p>
                    <textarea
                      value={notesDraft[candidate.key] ?? ""}
                      onChange={(event) =>
                        setNotesDraft((current) => ({
                          ...current,
                          [candidate.key]: event.target.value,
                        }))
                      }
                      rows={5}
                      className="w-full resize-y border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-3 text-sm leading-7 outline-none"
                      placeholder="写下为什么批准、拒绝，或者后续要怎么改写。"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      disabled={savingKey === candidate.key}
                      onClick={() => void submitDecision(candidate, "approved_source_note")}
                      variant="outline"
                      className="justify-start rounded-full"
                    >
                      <CheckCheck className="h-4 w-4" />
                      批准并生成来源草稿
                    </Button>
                    <Button
                      disabled={savingKey === candidate.key}
                      onClick={() => void submitDecision(candidate, "approved_recipe")}
                      className="justify-start rounded-full"
                    >
                      <CheckCheck className="h-4 w-4" />
                      批准并生成经验包草稿
                    </Button>
                    <Button
                      disabled={savingKey === candidate.key}
                      onClick={() => void submitDecision(candidate, "rejected")}
                      variant="outline"
                      className="justify-start rounded-full"
                    >
                      <XCircle className="h-4 w-4" />
                      拒绝
                    </Button>
                    <Button
                      disabled={savingKey === candidate.key}
                      onClick={() => void submitDecision(candidate, "archived")}
                      variant="outline"
                      className="justify-start rounded-full"
                    >
                      <RotateCcw className="h-4 w-4" />
                      归档
                    </Button>
                  </div>

                  {candidate.draft ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {candidate.published ? (
                        <>
                          <Button
                            type="button"
                            disabled={publishingKey === candidate.key}
                            onClick={() => void publishCandidate(candidate)}
                            className="justify-start rounded-full"
                          >
                            <CheckCheck className="h-4 w-4" />
                            重新发布到前台
                          </Button>
                          <Button
                            type="button"
                            disabled={publishingKey === candidate.key || !(unpublishReasonDraft[candidate.key] ?? "").trim()}
                            onClick={() => void unpublishCandidate(candidate)}
                            variant="outline"
                            className="justify-start rounded-full"
                          >
                            <RotateCcw className="h-4 w-4" />
                            撤回发布
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          disabled={
                            publishingKey === candidate.key ||
                            (candidate.status !== "approved_source_note" && candidate.status !== "approved_recipe")
                          }
                          onClick={() => void publishCandidate(candidate)}
                          className="justify-start rounded-full sm:col-span-2"
                        >
                          <CheckCheck className="h-4 w-4" />
                          发布到前台
                        </Button>
                      )}
                    </div>
                  ) : null}

                  {candidate.published ? (
                    <div className="space-y-3 border-t border-[color:var(--border)] pt-4">
                      <p className="eyebrow">发布后管理</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Button
                          type="button"
                          disabled={publishingKey === candidate.key}
                          onClick={() => void runPublishControl(candidate, "move_up")}
                          variant="outline"
                          className="justify-start rounded-full"
                        >
                          <ArrowUp className="h-4 w-4" />
                          上移一位
                        </Button>
                        <Button
                          type="button"
                          disabled={publishingKey === candidate.key}
                          onClick={() => void runPublishControl(candidate, "move_down")}
                          variant="outline"
                          className="justify-start rounded-full"
                        >
                          <ArrowDown className="h-4 w-4" />
                          下移一位
                        </Button>
                        <Button
                          type="button"
                          disabled={publishingKey === candidate.key}
                          onClick={() =>
                            void runPublishControl(candidate, candidate.published?.pinned ? "unpin" : "pin")
                          }
                          variant="outline"
                          className="justify-start rounded-full sm:col-span-2"
                        >
                          {candidate.published?.pinned ? (
                            <>
                              <PinOff className="h-4 w-4" />
                              取消置顶
                            </>
                          ) : (
                            <>
                              <Pin className="h-4 w-4" />
                              置顶到前台前列
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {(candidate.published || candidate.lastUnpublishReason) ? (
                    <div className="space-y-2 border-t border-[color:var(--border)] pt-4">
                      <p className="eyebrow">下线原因记录</p>
                      <textarea
                        value={unpublishReasonDraft[candidate.key] ?? ""}
                        onChange={(event) =>
                          setUnpublishReasonDraft((current) => ({
                            ...current,
                            [candidate.key]: event.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full resize-y border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-3 text-sm leading-7 outline-none"
                        placeholder="比如：标题还不稳、需要补真实示例、排序让位给更高优先级内容。"
                      />
                    </div>
                  ) : null}

                  <div className="border-t border-[color:var(--border)] pt-4 text-sm leading-7 text-[color:var(--muted-foreground)]">
                    <p>当前状态：{statusLabel[candidate.status]}</p>
                    <p>最后审核：{candidate.reviewedAt ? formatTime(candidate.reviewedAt) : "未审核"}</p>
                    <p>审核人：{candidate.reviewer || "未记录"}</p>
                  </div>
                </div>
              </div>

              {draftPreviews[candidate.key] ? (
                <div className="mt-6 border-t border-[color:var(--border)] pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="eyebrow mb-2">草稿预览</p>
                      <p className="text-sm text-[color:var(--muted-foreground)]">
                        {draftPreviews[candidate.key]?.filePath}
                      </p>
                    </div>
                    <p className="text-xs text-[color:var(--muted-foreground)]">
                      最近生成：{formatTime(draftPreviews[candidate.key]?.updatedAt || "")}
                    </p>
                  </div>

                  <pre className="mt-4 overflow-x-auto border border-[color:var(--border)] bg-[color:var(--panel-muted)] p-4 text-xs leading-6 text-[color:var(--foreground)] whitespace-pre-wrap">
                    {draftPreviews[candidate.key]?.content}
                  </pre>

                  {(draftPreviews[candidate.key]?.snapshots?.length ?? 0) > 0 ? (
                    <div className="mt-4">
                      <p className="eyebrow mb-2">历史快照</p>
                      <div className="space-y-2 text-sm leading-7 text-[color:var(--muted-foreground)]">
                        {draftPreviews[candidate.key]?.snapshots?.map((snapshot) => (
                          <div
                            key={`${snapshot.filePath}-${snapshot.updatedAt}`}
                            className="border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-3 py-2"
                          >
                            <p>{snapshot.fileName}</p>
                            <p>{snapshot.filePath}</p>
                            <p>{formatTime(snapshot.updatedAt)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <details className="mt-6 border-t border-[color:var(--border)] pt-4">
                <summary className="cursor-pointer text-sm font-medium text-[color:var(--foreground)]">
                  查看审核历史（{candidate.history.length}）
                </summary>
                <div className="mt-4 space-y-3">
                  {candidate.history.length === 0 ? (
                    <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">这条内容还没有历史记录。</p>
                  ) : (
                    candidate.history
                      .slice()
                      .reverse()
                      .map((entry) => (
                        <div key={`${entry.reviewedAt}-${entry.status}`} className="border border-[color:var(--border)] bg-[color:var(--panel-muted)] p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="subtle">{statusLabel[entry.status]}</Badge>
                            <span className="text-xs text-[color:var(--muted-foreground)]">
                              {formatTime(entry.reviewedAt)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-7 text-[color:var(--foreground)]">
                            {entry.notes || "无备注"}
                          </p>
                        </div>
                      ))
                  )}
                </div>
              </details>
            </article>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}
