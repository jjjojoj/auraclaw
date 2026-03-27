import { CheckCircle2, Circle } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recipes, tracks } from "@/data";
import { useAllProgress } from "@/lib/useRecipeProgress";

export function ProgressMap() {
  const progress = useAllProgress();
  const completedIds = Object.entries(progress)
    .filter(([, p]) => p.completed)
    .map(([id]) => id);

  const hasAny = completedIds.length > 0;

  return (
    <section className="section-space">
      <div className="mb-6">
        <p className="eyebrow">Your Progress</p>
        <h2 className="mt-2 font-serif text-2xl tracking-[-0.03em]">你的培养进度</h2>
        {!hasAny && (
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">完成第一个经验包后，你的进化地图就会开始生长。</p>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {tracks.map((track) => {
          const trackRecipes = recipes.filter((r) => r.trackId === track.id);
          const doneCount = trackRecipes.filter((r) => completedIds.includes(r.id)).length;
          if (hasAny && doneCount === 0) return null;
          return (
            <Card
              key={track.id}
              style={{ borderTop: `3px solid ${track.color}`, opacity: doneCount === 0 ? 0.45 : 1 }}
              className={doneCount === 0 ? "border-dashed" : ""}
            >
              <CardHeader className="gap-1 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">{track.name}</CardTitle>
                  <span className="text-xs text-[color:var(--muted-foreground)]">
                    {doneCount > 0 ? `${doneCount} / ${trackRecipes.length} 跑通` : `${trackRecipes.length} 个经验包待解锁`}
                  </span>
                </div>
              </CardHeader>
              {doneCount > 0 && (
                <CardContent>
                  <ul className="space-y-2">
                    {trackRecipes.map((recipe) => {
                      const done = completedIds.includes(recipe.id);
                      return (
                        <li key={recipe.id}>
                          <Link
                            to={`/recipes/${recipe.slug}`}
                            className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-[color:var(--panel-muted)]"
                          >
                            {done ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "var(--success)" }} />
                            ) : (
                              <Circle className="h-4 w-4 shrink-0 text-[color:var(--step-pending)]" />
                            )}
                            <span
                              className={done ? "text-[color:var(--step-done)] line-through" : "text-[color:var(--foreground)]"}
                            >
                              {recipe.title}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
