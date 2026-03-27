import { Bot, ChevronRight, PersonStanding, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { CopyButton } from "@/components/CopyButton";
import { Layout } from "@/components/Layout";
import { ProgressMap } from "@/components/ProgressMap";
import { RecipeCard } from "@/components/RecipeCard";
import { SectionHeading } from "@/components/SectionHeading";
import { TrackCard } from "@/components/TrackCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
        <div className="space-y-7">
          <Badge variant="accent">AuraClaw</Badge>
          <div className="space-y-5">
            <h1 className="font-serif text-5xl leading-[1.04] tracking-[-0.05em] text-[color:var(--foreground)] sm:text-6xl lg:text-7xl">
              养成一只真正会做事的 OpenClaw
            </h1>
            <p className="max-w-2xl text-base leading-8 text-[color:var(--muted-foreground)] sm:text-lg">
              比如：5 分钟之内，让 OpenClaw 把一小时的会议内容压成 3 段话加行动清单。每个经验包都有验证清单——你能确认它真的跑通了。
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-[color:var(--border)] bg-white/60 p-4">
            {[
              { label: "拿结果", desc: "先做成一件事", to: "/recipes/feishu-meeting-digest" },
              { label: "补能力", desc: "装对的工具", to: "/recipes/scrapling-extension" },
              { label: "练表达", desc: "说清楚任务", to: "/recipes/timed-task-dialogue-training" },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex flex-col items-center gap-1 rounded-xl p-3 text-center transition-colors hover:bg-[color:var(--panel-muted)]"
              >
                <span className="text-sm font-semibold text-[color:var(--foreground)]">{item.label}</span>
                <span className="text-xs text-[color:var(--muted-foreground)]">{item.desc}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-5 text-sm text-[color:var(--muted-foreground)]">
            <span><strong className="font-semibold text-[color:var(--foreground)]">{recipes.length}</strong> 个经验包</span>
            <span className="h-3 w-px bg-[color:var(--border)]" />
            <span><strong className="font-semibold text-[color:var(--foreground)]">{tracks.length}</strong> 条培养路径</span>
            <span className="h-3 w-px bg-[color:var(--border)]" />
            <span>每个经验包均含验证清单</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/starter-pack">
                从 Starter Pack 开始
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#featured-packs">先看 3 个经验包</a>
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="gap-4 border-b border-[color:var(--border)]">
            <Badge variant="subtle">进入方式</Badge>
            <CardTitle className="text-2xl leading-9">你是人类，还是 AI</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs className="w-full" defaultValue="human">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="human">
                  <PersonStanding className="h-4 w-4" />
                  我是人类
                </TabsTrigger>
                <TabsTrigger value="ai">
                  <Bot className="h-4 w-4" />
                  我是 AI
                </TabsTrigger>
              </TabsList>

              <TabsContent value="human" className="space-y-5">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-[color:var(--foreground)]">继续进入 AuraClaw</h3>
                  <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
                    第一次来只做 1 件事就够了：选一个经验包，复制给 OpenClaw，按页面里的验证方法跑通。
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    "先选最接近你当前问题的经验包",
                    "把整段经验包复制给 OpenClaw",
                    "按页面里的验证标准看是否跑通",
                  ].map((step, index) => (
                    <div
                      key={step}
                      className="rounded-[22px] border border-[color:var(--border)] bg-white/70 p-4 text-sm leading-7 text-[color:var(--foreground)]"
                    >
                      <p className="eyebrow">Step 0{index + 1}</p>
                      <p className="mt-2">{step}</p>
                    </div>
                  ))}
                </div>

                <Button asChild className="w-full justify-between">
                  <Link to="/starter-pack">
                    继续进入网站
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </TabsContent>

              <TabsContent value="ai" className="space-y-5">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-[color:var(--foreground)]">把这段话发给你的 OpenClaw</h3>
                  <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
                    它会先读取 `skill.md`，再按里面的规则使用 AuraClaw。
                  </p>
                </div>

                <div className="space-y-3">
                  <CopyButton className="w-full sm:w-auto" text={skillInstruction} />
                  <pre className="code-surface overflow-x-auto">
                    <code>{skillInstruction}</code>
                  </pre>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    "把上面的整段话发给你的 OpenClaw",
                    "它会先读取 skill.md 了解 AuraClaw",
                    "然后再按经验包、验证和回退规则来工作",
                  ].map((step, index) => (
                    <div
                      key={step}
                      className="rounded-[22px] border border-[color:var(--border)] bg-white/70 p-4 text-sm leading-7 text-[color:var(--foreground)]"
                    >
                      <p className="eyebrow">Step 0{index + 1}</p>
                      <p className="mt-2">{step}</p>
                    </div>
                  ))}
                </div>

                <Button asChild className="w-full justify-between" variant="outline">
                  <a href={skillUrl} target="_blank" rel="noreferrer">
                    打开 skill.md
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <section className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-[color:var(--border)] py-5">
        {[
          { value: "6", label: "个经验包" },
          { value: "每个", label: "都有验证清单" },
          { value: "失败了", label: "有回退方案" },
          { value: "不装不需要", label: "的能力" },
        ].map((item) => (
          <div key={item.label} className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">{item.value}</span>
            <span className="text-sm text-[color:var(--muted-foreground)]">{item.label}</span>
          </div>
        ))}
      </section>

      <section className="section-space" id="featured-packs">
        <SectionHeading eyebrow="Start Here" title="先从这 3 个经验包里选一个" body="只选一个，先跑通。" />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {featuredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>

      <section className="section-space">
        <SectionHeading
          eyebrow="What AuraClaw Delivers"
          title="AuraClaw 交给 OpenClaw 的是一整段经验"
          body="里面会把下载、验证、回退和后续说法一起打包进去。"
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "先判断要不要装能力",
              body: "不是所有问题都靠换一句话解决。有些问题先补能力，成功率会直接变高。",
            },
            {
              title: "把来源、安装和验证一起交代清楚",
              body: "该读哪个仓库、去哪下载、装完怎么验，都会放进经验包里。",
            },
            {
              title: "最后告诉 OpenClaw 成功后怎么继续做",
              body: "不是停在安装成功，而是继续告诉它之后最短应该怎么帮你工作。",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader className="gap-4">
                <Sparkles className="h-5 w-5 text-[color:var(--accent-color)]" />
                <CardTitle className="text-xl leading-8">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <ProgressMap />

      <section className="section-space">
        <SectionHeading eyebrow="Tracks" title="四条培养路径" body="等你跑通第一个结果，再顺着往下长。" />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      </section>

      <section className="section-space">
        <SectionHeading eyebrow="More Packs" title="你也可以直接看这些" />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {extraRecipes.slice(0, 3).map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>
    </Layout>
  );
}
