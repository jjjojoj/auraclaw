import { ArrowUpRight, BookMarked, Compass, Layers3, Network } from "lucide-react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { tracks } from "@/data";
import { featuredSourceNoteIds, sourceNotes } from "@/source-notes";
import type { SourceNote, TrackId } from "@/types";

const collections = [
  {
    id: "route",
    eyebrow: "学习路径骨架",
    title: "从第一次成功到长期成长",
    body: "先拿到第一次成功，再进入能力扩展，最后才是 OPC 的长期成长。",
    noteIds: ["OC101-002", "OC101-003", "OC101-004", "OC101-008", "OC101-012"],
    icon: Compass,
  },
  {
    id: "china-platform",
    eyebrow: "中文平台接入",
    title: "飞书、钉钉、企微这几条路怎么走",
    body: "这组来源最适合支持中文协作平台的接入判断、第一条工作流和接入前体检。",
    noteIds: ["OC101-005", "OC101-006", "OC101-007", "OC101-009"],
    icon: Network,
  },
  {
    id: "extension",
    eyebrow: "能力扩展与国内环境",
    title: "能力接入、模型选择与进阶理解",
    body: "这里放的是国内用户比较容易卡住的模型接入、部署差异和进阶理解来源。",
    noteIds: ["OC101-001", "OC101-010", "OC101-011", "OC101-013"],
    icon: Layers3,
  },
];

function prioritizeByPublishedId<T extends { id: string }>(
  items: T[],
  publishedPrefix: string,
  fallbackIds: string[],
  limit: number,
) {
  const published = items.filter((item) => item.id.startsWith(publishedPrefix));
  const fallback = items.filter((item) => fallbackIds.includes(item.id));
  const merged = [...published, ...fallback];
  const unique = new Map(merged.map((item) => [item.id, item]));
  return Array.from(unique.values()).slice(0, limit);
}

function getTrackMeta(trackId: TrackId) {
  const track = tracks.find((item) => item.id === trackId);
  return {
    label: track?.name ?? trackId,
    path: track?.path ?? "/",
    color: track?.color ?? "var(--foreground)",
  };
}

function SourceNoteCard({ note }: { note: SourceNote }) {
  const primaryTrack = getTrackMeta(note.boardFit[0]);

  return (
    <article className="flex h-full flex-col border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="eyebrow">{note.siteName}</span>
        <span className="inline-flex items-center rounded-sm border border-[color:var(--border-strong)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]">
          {note.contentType.replace("_", " ")}
        </span>
        {note.newbieFriendly ? (
          <span className="inline-flex items-center rounded-sm border border-[color:var(--border)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--foreground)]">
            新手友好
          </span>
        ) : null}
      </div>

      <h3 className="font-serif text-2xl leading-snug tracking-[-0.02em] text-[color:var(--foreground)]">
        {note.title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-[color:var(--muted-foreground)]">{note.summary}</p>

      <ul className="mt-5 space-y-2">
        {note.keyPoints.slice(0, 3).map((point) => (
          <li key={point} className="flex gap-2.5 text-sm text-[color:var(--foreground)]">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: primaryTrack.color }} />
            <span>{point}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        {note.boardFit.map((trackId) => {
          const meta = getTrackMeta(trackId);
          return (
            <Link
              key={`${note.id}-${trackId}`}
              to={meta.path}
              className="inline-flex items-center rounded-sm border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted-foreground)] transition-opacity hover:opacity-60"
              style={{ borderColor: "var(--border-strong)" }}
            >
              {meta.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 border-t border-[color:var(--border)] pt-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">适合拿来做</p>
        <p className="mt-2 text-sm leading-7 text-[color:var(--foreground)]">{note.recommendedFor.join(" / ")}</p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 pt-6">
        <p className="text-xs text-[color:var(--muted-foreground)]">最后检查：{note.lastChecked}</p>
        <Button asChild size="sm" variant="outline" className="rounded-full px-4">
          <a href={note.sourceUrl} target="_blank" rel="noreferrer">
            打开来源
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </article>
  );
}

export function SourceIndexPage() {
  const featuredNotes = prioritizeByPublishedId(sourceNotes, "PUB-SRC-", featuredSourceNoteIds, 4);
  const newbieCount = sourceNotes.filter((note) => note.newbieFriendly).length;
  const chinesePlatformCount = sourceNotes.filter((note) =>
    note.recommendedFor.some((item) => item.includes("接入") || item.includes("协作")),
  ).length;

  return (
    <Layout accent="var(--extension)">
      <section className="pt-16 sm:pt-24">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <p className="eyebrow mb-5">Source Index</p>
            <h1 className="font-serif text-4xl leading-[1.06] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              我们实际在参考什么
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[color:var(--muted-foreground)]">
              这里不是外链堆叠，而是 AuraClaw 目前正在使用的来源地图。我们把学习路径、中文接入来源和长期成长路线整理出来，再改写成经验包。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="rounded-full px-5">
                <Link to="/tracks/care">先看起步路线</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-5">
                <a href="#collections">直接看来源分组</a>
              </Button>
            </div>
          </div>

          <div className="grid gap-px border border-[color:var(--border)] bg-[color:var(--border)]">
            {[
              { label: "已整理 source note", value: `${sourceNotes.length} 条` },
              { label: "新手友好来源", value: `${newbieCount} 条` },
              { label: "中文平台接入来源", value: `${chinesePlatformCount} 条` },
            ].map((item) => (
              <div key={item.label} className="bg-[color:var(--panel)] p-5">
                <p className="eyebrow mb-2">{item.label}</p>
                <p className="font-serif text-3xl tracking-[-0.03em]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <SectionHeading
          eyebrow="怎么使用"
          title="先看骨架，再决定往哪条路径走"
          body="对普通用户来说，来源页不是让你多看，而是帮你快速知道哪些经验包背后有真实中文来源和学习顺序。"
        />
        <div className="mt-10 grid gap-px bg-[color:var(--border)] lg:grid-cols-3">
          {[
            {
              title: "先找顺序",
              body: "先看 day1、day4、day7 这类学习骨架，知道自己该先拿结果、先补能力，还是先搭工作系统。",
            },
            {
              title: "再找中文路径",
              body: "飞书、钉钉、企微这类平台接入，优先看中文来源，少走国外模板不适配的弯路。",
            },
            {
              title: "最后进经验包",
              body: "看完来源后，不用自己拼流程，直接回到 AuraClaw 的经验包，把整理好的执行包交给 OpenClaw。",
            },
          ].map((item) => (
            <div key={item.title} className="bg-[color:var(--panel)] p-6">
              <p className="font-serif text-2xl tracking-[-0.02em] text-[color:var(--foreground)]">{item.title}</p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted-foreground)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-space">
        <SectionHeading
          eyebrow="精选来源"
          title="先看这 4 条就够了"
          body="这几条最能代表 AuraClaw 现在的主线：第一次成功、能力扩展、中文接入和国内模型路径。"
        />
        <div className="mt-10 grid gap-px bg-[color:var(--border)] lg:grid-cols-2">
          {featuredNotes.map((note) => (
            <SourceNoteCard key={note.id} note={note} />
          ))}
        </div>
      </section>

      <section id="collections" className="section-space">
        <div className="space-y-16">
          {collections.map((collection) => {
            const Icon = collection.icon;
            const notes = sourceNotes.filter((note) => collection.noteIds.includes(note.id));

            return (
              <div key={collection.id}>
                <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_2fr] lg:items-start">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[color:var(--border)] bg-[color:var(--panel)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="eyebrow">{collection.eyebrow}</p>
                      <h2 className="mt-3 font-serif text-3xl tracking-[-0.02em]">{collection.title}</h2>
                    </div>
                  </div>
                  <p className="max-w-3xl text-base leading-8 text-[color:var(--muted-foreground)]">{collection.body}</p>
                </div>

                <div className="grid gap-px bg-[color:var(--border)] lg:grid-cols-2">
                  {notes.map((note) => (
                    <SourceNoteCard key={note.id} note={note} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section-space">
        <div className="grid gap-6 border-t border-[color:var(--border)] pt-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="eyebrow mb-2">下一步</p>
            <p className="font-serif text-2xl tracking-[-0.02em]">来源看完了，继续进入经验包</p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted-foreground)]">
              如果你现在最缺的是第一条成功，先回 `产后护理`；如果你已经知道卡在能力上，就直接进 `能力扩展`。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full px-5">
              <Link to="/tracks/care">
                去看产后护理
                <BookMarked className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-5">
              <Link to="/tracks/extension">
                去看能力扩展
                <Layers3 className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
