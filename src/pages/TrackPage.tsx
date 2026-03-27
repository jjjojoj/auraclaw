import { ArrowRight } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { RecipeCard } from "@/components/RecipeCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recipes, tracks } from "@/data";

export function TrackPage() {
  const { trackId } = useParams();
  const track = tracks.find((item) => item.id === trackId);

  if (!track) {
    return <Navigate to="/" replace />;
  }

  const trackRecipes = recipes.filter((recipe) => recipe.trackId === track.id);
  const currentIndex = tracks.findIndex((item) => item.id === track.id);
  const nextTrack = tracks[(currentIndex + 1) % tracks.length];

  const trackColorHex: Record<string, string> = {
    care: "#d66d42",
    extension: "#1f6b63",
    dialogue: "#5070a8",
    opc: "#8d5f2c",
  };
  const tint = trackColorHex[track.id] ?? "#d66d42";

  return (
    <div style={{ background: `color-mix(in srgb, #f3eee7 96%, ${tint} 4%)`, minHeight: "100vh" }}>
    <Layout accent={track.color}>
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="space-y-5">
          <Badge variant="accent">{track.name}</Badge>
          <div className="space-y-4">
            <h1 className="font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">{track.summary}</h1>
            <p className="max-w-2xl text-base leading-8 text-[color:var(--muted-foreground)]">{track.promise}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="gap-3">
            <Badge variant="subtle">进入方式</Badge>
            <CardTitle className="text-2xl leading-9">{track.entryQuestion}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <p className="text-sm leading-7 text-[color:var(--foreground)]">{track.goal}</p>
              <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">{track.heroNote}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {track.signatureSignals.map((signal) => (
                <Badge key={signal}>{signal}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="section-space">
        <SectionHeading eyebrow="Experiences" title={`${trackRecipes.length} 条经验包，按上手顺序排好了`} body="先跑通一个，再换下一个。" />
        <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {trackRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>

      <section className="section-space grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="gap-3">
            <Badge variant="subtle">适合谁</Badge>
            <CardTitle className="text-2xl leading-9">现在就适合进入这条路径的人</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-7 text-[color:var(--foreground)]">
              {track.starterAudience.map((audience) => (
                <li key={audience} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[color:var(--accent-color)]" />
                  <span>{audience}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <Badge variant="subtle">Next</Badge>
            <CardTitle className="text-xl leading-8">下一条路径</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">{nextTrack.summary}</p>
            <Button asChild className="w-full justify-between" variant="outline">
              <Link to={nextTrack.path}>
                去看 {nextTrack.name}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </Layout>
    </div>
  );
}
