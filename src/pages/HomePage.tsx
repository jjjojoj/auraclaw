import { Bot, ChevronRight, PersonStanding } from "lucide-react";
import { Link } from "react-router-dom";
import { CopyButton } from "@/components/CopyButton";
import { Layout } from "@/components/Layout";
import { ProgressMap } from "@/components/ProgressMap";
import { RecipeCard } from "@/components/RecipeCard";
import { SectionHeading } from "@/components/SectionHeading";
import { TrackCard } from "@/components/TrackCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.1fr)_24rem] lg:items-start">
          <div>
            <div className="max-w-4xl">
              <p className="eyebrow mb-6">OpenClaw 经验进化平台</p>
              <h1 className="font-serif text-5xl leading-[1.06] tracking-[-0.03em] text-[color:var(--foreground)] sm:text-6xl lg:text-7xl xl:text-8xl">
                养成一只<br />
                真正会做事的<br />
                <em className="not-italic" style={{ color: "var(--care)" }}>OpenClaw</em>
              </h1>
              <p className="mt-8 max-w-xl text-base leading-8 text-[color:var(--muted-foreground)] sm:text-lg">
                把别人已经验证的经验直接装进来。每个经验包都有验证清单，你能确认它真的跑通了。
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button asChild size="lg" variant="secondary" className="rounded-full px-7 text-sm font-semibold shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
                  <Link to="/starter-pack">从 Starter Pack 开始 →</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-7 text-sm font-semibold">
                  <a href="#featured-packs">先看 3 个经验包</a>
                </Button>
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
          </div>

          <div className="border border-[color:var(--border)] bg-[color:var(--panel)] p-6 sm:p-7">
            <Tabs defaultValue="human">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="human" className="gap-2 px-0 pr-5">
                  <PersonStanding className="h-4 w-4" />
                  我是人类
                </TabsTrigger>
                <TabsTrigger value="ai" className="gap-2 px-0 pl-5">
                  <Bot className="h-4 w-4" />
                  我是 AI
                </TabsTrigger>
              </TabsList>

              <TabsContent value="human" className="space-y-6">
                <div>
                  <p className="eyebrow mb-3">第一次来，先做这一件事</p>
                  <h2 className="font-serif text-2xl tracking-[-0.02em] text-[color:var(--foreground)]">选一个经验包，直接开始</h2>
                </div>

                <div className="space-y-3">
                  {[
                    "先选最接近你当前问题的经验包",
                    "把整段经验复制给 OpenClaw",
                    "按页面里的验证方法确认它真的跑通了",
                  ].map((step, index) => (
                    <div key={step} className="flex gap-4 border-t border-[color:var(--border)] pt-3 first:border-t-0 first:pt-0">
                      <span className="mt-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                        0{index + 1}
                      </span>
                      <p className="text-sm leading-7 text-[color:var(--foreground)]">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button asChild className="rounded-full px-5">
                    <Link to="/starter-pack">
                      继续进入网站
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild className="rounded-full px-5" variant="outline">
                    <a href="#featured-packs">直接看经验包</a>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="ai" className="space-y-6">
                <div>
                  <p className="eyebrow mb-3">如果你是 OpenClaw 或其他 AI</p>
                  <h2 className="font-serif text-2xl tracking-[-0.02em] text-[color:var(--foreground)]">先读取 AuraClaw skill</h2>
                </div>

                <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
                  复制下面这段指令，粘贴到对话框里。你会先读取 `skill.md`，再知道该如何帮助用户浏览 AuraClaw。
                </p>

                <div className="code-surface text-xs">
                  {skillInstruction}
                </div>

                <div className="flex flex-wrap gap-3">
                  <CopyButton text={skillInstruction} label="复制 Skill 指令" variant="outline" size="sm" />
                  <Button asChild size="sm" variant="ghost">
                    <a href={skillUrl} target="_blank" rel="noreferrer">
                      打开 skill.md
                    </a>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
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

      {/* Tracks */}
      <section className="section-space">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:items-start">
          <div>
            <SectionHeading eyebrow="培养路径" title="四条培养路径" body="等你跑通第一个结果，再顺着往下长。" />
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
        <SectionHeading eyebrow="更多经验包" title="你也可以直接看这些" />
        <div className="mt-10 grid gap-px bg-[color:var(--border)] lg:grid-cols-3">
          {extraRecipes.slice(0, 3).map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>

      <ProgressMap />
    </Layout>
  );
}
