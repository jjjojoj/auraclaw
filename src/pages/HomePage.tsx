import { Link } from "react-router-dom";
import { CopyButton } from "@/components/CopyButton";
import { Layout } from "@/components/Layout";
import { ProgressMap } from "@/components/ProgressMap";
import { RecipeCard } from "@/components/RecipeCard";
import { SectionHeading } from "@/components/SectionHeading";
import { TrackCard } from "@/components/TrackCard";
import { highlightedRecipeIds, recipes, tracks } from "@/data";

const heroRecipeIds = ["C1", "E1", "D1"];

export function HomePage() {
  const skillUrl =
    typeof window !== "undefined" ? `${window.location.origin}/skill.md` : "/skill.md";
  const skillInstruction = `Read ${skillUrl} and use AuraClaw according to the instructions in that file.`;
  const featuredRecipes = recipes.filter((recipe) => heroRecipeIds.includes(recipe.id));
  const extraRecipes = recipes.filter(
    (recipe) => highlightedRecipeIds.includes(recipe.id) && !heroRecipeIds.includes(recipe.id),
  );

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-16 sm:pt-24 lg:pt-32">
        <div className="max-w-4xl">
          <p className="eyebrow mb-6">OpenClaw 经验进化平台</p>
          <h1 className="font-serif text-5xl leading-[1.06] tracking-[-0.03em] text-[color:var(--foreground)] sm:text-6xl lg:text-7xl xl:text-8xl">
            养成一只<br />
            真正会做事的<br />
            <em className="not-italic" style={{ color: "var(--care)" }}>OpenClaw</em>
          </h1>
          <p className="mt-8 max-w-xl text-base leading-8 text-[color:var(--muted-foreground)] sm:text-lg">
            把别人已经验证的经验直接装进来。每个经验包都有验证清单——你能确认它真的跑通了。
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/starter-pack"
              className="inline-flex items-center gap-2 bg-[color:var(--foreground)] px-6 py-3 text-sm font-medium text-[color:var(--primary-foreground)] transition-opacity hover:opacity-80"
            >
              从 Starter Pack 开始 →
            </Link>
            <Link
              to="#featured-packs"
              className="text-sm text-[color:var(--muted-foreground)] underline underline-offset-4 hover:text-[color:var(--foreground)]"
            >
              先看 3 个经验包
            </Link>
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[color:var(--border)] pt-6 text-sm text-[color:var(--muted-foreground)]">
          <span><strong className="font-semibold text-[color:var(--foreground)]">{recipes.length}</strong> 个经验包</span>
          <span className="h-px w-4 bg-[color:var(--border)]" />
          <span><strong className="font-semibold text-[color:var(--foreground)]">{tracks.length}</strong> 条培养路径</span>
          <span className="h-px w-4 bg-[color:var(--border)]" />
          <span>每个经验包均含验证清单</span>
          <span className="h-px w-4 bg-[color:var(--border)]" />
          <span>可复现 · 可验证 · 可回退</span>
        </div>
      </section>

      {/* Featured packs */}
      <section id="featured-packs" className="section-space">
        <SectionHeading eyebrow="精选经验包" title="先跑通一件事" body="不用从头研究，直接拿已经验证过的经验。" />
        <div className="mt-10 grid gap-px bg-[color:var(--border)] lg:grid-cols-3">
          {featuredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>

      {/* Editorial pull quote — What is AuraClaw */}
      <section className="section-space">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:items-start">
          <div>
            <p className="eyebrow">AuraClaw 是什么</p>
          </div>
          <div>
            <blockquote className="font-serif text-2xl leading-relaxed tracking-[-0.02em] text-[color:var(--foreground)] sm:text-3xl">
              「不是教程网站，不是 Prompt 市场——<br />
              是一台让正确经验可以被继承的<em className="not-italic" style={{ color: "var(--extension)" }}>培养台</em>。」
            </blockquote>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                { label: "可复现", body: "每个经验包都包含完整的安装、验证、回退说明。" },
                { label: "可验证", body: "你能确认它真的跑通了，不只是看起来像跑通了。" },
                { label: "可继承", body: "别人的经验直接装进来，不用从头摸索。" },
              ].map((item) => (
                <div key={item.label} className="border-t-2 border-[color:var(--foreground)] pt-4">
                  <p className="text-sm font-semibold text-[color:var(--foreground)] mb-2">{item.label}</p>
                  <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI entry — for AI agents reading this page */}
      <section className="section-space">
        <div className="border border-[color:var(--border)] p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:items-start">
            <div>
              <p className="eyebrow">如果你是 AI</p>
              <h2 className="mt-3 font-serif text-xl tracking-[-0.02em]">直接读 AuraClaw skill</h2>
            </div>
            <div className="space-y-5">
              <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
                如果你是 OpenClaw 或其他 AI，复制下面的指令，粘贴到你的对话框里，你就会知道该怎么帮用户浏览 AuraClaw。
              </p>
              <div className="code-surface text-xs">
                {skillInstruction}
              </div>
              <CopyButton text={skillInstruction} label="复制 Skill 指令" variant="outline" size="sm" />
            </div>
          </div>
        </div>
      </section>

      <ProgressMap />

      {/* Tracks */}
      <section className="section-space">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:items-start">
          <div>
            <SectionHeading eyebrow="Tracks" title="四条培养路径" body="等你跑通第一个结果，再顺着往下长。" />
          </div>
          <div>
            {tracks.map((track, i) => (
              <TrackCard key={track.id} track={track} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* More packs */}
      <section className="section-space">
        <SectionHeading eyebrow="More Packs" title="你也可以直接看这些" />
        <div className="mt-10 grid gap-px bg-[color:var(--border)] lg:grid-cols-3">
          {extraRecipes.slice(0, 3).map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>
    </Layout>
  );
}
