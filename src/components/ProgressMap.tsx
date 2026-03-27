import { CheckCircle2, Circle } from "lucide-react";
import { Link } from "react-router-dom";
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
      <div className="mb-8">
        <p className="eyebrow">Your Progress</p>
        <h2 className="mt-3 font-serif text-2xl tracking-[-0.02em]">你的培养进度</h2>
        {!hasAny && (
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">完成第一个经验包后，你的进化地图就会开始生长。</p>
        )}
      </div>

      <div className="divide-y divide-[color:var(--border)]">
        {tracks.map((track) => {
          const trackRecipes = recipes.filter((r) => r.trackId === track.id);
          const doneCount = trackRecipes.filter((r) => completedIds.includes(r.id)).length;
          if (hasAny && doneCount === 0) return null;

          return (
            <div key={track.id} className="py-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: track.color }} />
                  <span className="text-sm font-medium text-[color:var(--foreground)]">{track.name}</span>
                </div>
                <span className="text-xs text-[color:var(--muted-foreground)]">
                  {doneCount > 0 ? `${doneCount} / ${trackRecipes.length} 跑通` : `${trackRecipes.length} 个待解锁`}
                </span>
              </div>

              {doneCount > 0 && (
                <ul className="space-y-1.5 pl-4">
                  {trackRecipes.map((recipe) => {
                    const done = completedIds.includes(recipe.id);
                    return (
                      <li key={recipe.id}>
                        <Link
                          to={`/recipes/${recipe.slug}`}
                          className="flex items-center gap-2.5 py-1 text-sm transition-colors hover:text-[color:var(--foreground)]"
                          style={{ color: done ? "var(--step-done)" : "var(--muted-foreground)" }}
                        >
                          {done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className={done ? "line-through" : ""}>{recipe.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
