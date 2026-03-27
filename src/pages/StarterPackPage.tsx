import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DiagnosisFlow } from "@/components/DiagnosisFlow";
import { Layout } from "@/components/Layout";
import { RecipeCard } from "@/components/RecipeCard";
import { SectionHeading } from "@/components/SectionHeading";
import { recipes, starterPackQuestions, tracks } from "@/data";

const recommendedIds = ["C1", "E1", "D1"];

export function StarterPackPage() {
  const recommendedRecipes = recipes.filter((recipe) => recommendedIds.includes(recipe.id));

  return (
    <Layout accent="var(--care)">
      {/* Hero */}
      <section className="pt-16 sm:pt-24">
        <div className="max-w-3xl">
          <p className="eyebrow mb-6">Starter Pack</p>
          <h1 className="font-serif text-4xl leading-[1.06] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
            先说你想做成什么，<br />再决定从哪里开始
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[color:var(--muted-foreground)]">
            如果你还不确定先练哪一块，这里有 3 步帮你找到第一个经验包。
          </p>
        </div>

        <div className="mt-10 border-t border-[color:var(--border)] pt-8">
          <div className="flex flex-wrap gap-x-12 gap-y-4">
            <div>
              <p className="eyebrow mb-1">默认推荐组合</p>
              <p className="text-sm text-[color:var(--foreground)]">会议纪要整理 + Scrapling 抓取增强 + 定时任务表达校准</p>
            </div>
            <div>
              <p className="eyebrow mb-1">覆盖</p>
              <p className="text-sm text-[color:var(--foreground)]">结果感 · 能力接入 · 表达结构</p>
            </div>
          </div>
        </div>
      </section>

      {/* Diagnosis flow */}
      <section className="section-space">
        <SectionHeading eyebrow="Diagnosis" title="3 步找到你的第一个经验包" body="不确定从哪开始？回答两个问题，直接拿到推荐。" />
        <div className="mt-10">
          <DiagnosisFlow />
        </div>
      </section>

      {/* Recommended packs */}
      <section className="section-space">
        <SectionHeading eyebrow="Recommended" title="这 3 个是最稳的起步" />
        <div className="mt-10 grid gap-px bg-[color:var(--border)] lg:grid-cols-3">
          {recommendedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="section-space">
        <SectionHeading eyebrow="FAQ" title="常见问题" />
        <div className="mt-10 space-y-0 divide-y divide-[color:var(--border)] border-t border-[color:var(--border)]">
          {starterPackQuestions.map((q) => (
            <div key={q.title} className="grid gap-4 py-8 lg:grid-cols-[1fr_2fr]">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">{q.title}</p>
              <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">{q.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Track map */}
      <section className="section-space">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:items-start">
          <div>
            <p className="eyebrow mb-3">Road Map</p>
            <p className="font-serif text-xl tracking-[-0.02em]">Starter Pack 会把你带去这 4 条路径</p>
          </div>
          <div className="grid gap-px bg-[color:var(--border)] sm:grid-cols-2">
            {tracks.map((track) => (
              <Link
                key={track.id}
                to={track.path}
                className="flex items-start gap-4 bg-[color:var(--panel)] p-5 transition-colors hover:bg-[color:var(--panel-muted)]"
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: track.color }} />
                <div>
                  <p className="text-sm font-semibold text-[color:var(--foreground)]">{track.name}</p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--muted-foreground)]">{track.summary}</p>
                </div>
                <ArrowRight className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-[color:var(--muted-foreground)]" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
