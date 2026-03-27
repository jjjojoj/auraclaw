import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DiagnosisFlow } from "@/components/DiagnosisFlow";
import { Layout } from "@/components/Layout";
import { RecipeCard } from "@/components/RecipeCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recipes, starterPackQuestions, tracks } from "@/data";

const recommendedIds = ["C1", "E1", "D1"];

export function StarterPackPage() {
  const recommendedRecipes = recipes.filter((recipe) => recommendedIds.includes(recipe.id));

  return (
    <Layout accent="var(--care)">
      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-5">
          <Badge variant="accent">Starter Pack</Badge>
          <div className="space-y-4">
            <h1 className="font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">
              先说你想做成什么，再决定从哪里开始
            </h1>
            <p className="max-w-2xl text-base leading-8 text-[color:var(--muted-foreground)]">
              如果你还不确定先练哪一块，就先从结果、能力、表达各挑一个。
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="gap-3">
            <Badge variant="subtle">默认推荐</Badge>
            <CardTitle className="text-2xl leading-9">会议纪要整理 + Scrapling 抓取增强 + 定时任务表达校准</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
              这 3 个刚好覆盖结果感、能力接入和表达结构，是现在最稳的起步组合。
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="section-space">
        <SectionHeading eyebrow="Diagnosis" title="不确定从哪开始？3 步找到你的第一个经验包" />
        <div className="mt-8">
          <DiagnosisFlow />
        </div>
      </section>

      <section className="section-space">
        <SectionHeading eyebrow="Decision" title="Starter Pack 看的就是这 4 个问题" />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {starterPackQuestions.map((item) => (
            <Card key={item.title}>
              <CardHeader className="gap-3">
                <Badge variant="subtle">Question</Badge>
                <CardTitle className="text-xl leading-8">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">{item.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-space">
        <SectionHeading eyebrow="Recommended" title="默认 Starter Pack" />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {recommendedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>

      <section className="section-space grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="gap-3">
            <Badge variant="subtle">Map</Badge>
            <CardTitle className="text-2xl leading-9">Starter Pack 最后会把你带去这 4 条路径</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {tracks.map((track) => (
              <div key={track.id} className="rounded-[22px] border border-[color:var(--border)] bg-white/70 p-4">
                <p className="text-sm font-semibold text-[color:var(--foreground)]">{track.name}</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted-foreground)]">{track.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <Badge variant="subtle">Next</Badge>
            <CardTitle className="text-xl leading-8">现在就开始</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-between">
              <Link to="/tracks/care">从产后护理开始 <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild className="w-full justify-between" variant="outline">
              <Link to="/tracks/extension">先去能力扩展 <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
