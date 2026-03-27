import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useRecipeProgress } from "@/lib/useRecipeProgress";
import type { Recipe } from "@/types";

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const highlights =
    recipe.experienceIncludes?.slice(0, 2) ??
    recipe.youWillGet?.slice(0, 2) ??
    recipe.passCriteria.slice(0, 2);
  const { isCompleted } = useRecipeProgress(recipe.id);

  return (
    <Link
      to={`/recipes/${recipe.slug}`}
      className="group flex h-full flex-col border-t-2 border-[color:var(--accent-color,var(--border))] bg-[color:var(--panel)] p-6 transition-shadow hover:shadow-[0_4px_20px_0_rgba(15,15,14,0.08)]"
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex flex-wrap gap-1.5">
          {recipe.starterLabel && (
            <span className="inline-flex items-center rounded-sm border border-[color:var(--border-strong)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]">
              {recipe.starterLabel}
            </span>
          )}
        </div>
        {isCompleted && (
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium" style={{ color: "var(--success)" }}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            已跑通
          </span>
        )}
      </div>

      <h3 className="font-serif text-2xl leading-snug tracking-[-0.02em] text-[color:var(--foreground)] mb-3">
        {recipe.title}
      </h3>

      <p className="text-base leading-7 text-[color:var(--muted-foreground)] mb-5 flex-1">
        {recipe.promise}
      </p>

      <ul className="space-y-2 mb-6">
        {highlights.map((item) => (
          <li key={item} className="flex gap-2.5 text-base text-[color:var(--foreground)]">
            <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--accent-color,var(--foreground))]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between text-sm text-[color:var(--muted-foreground)] pt-4 border-t border-[color:var(--border)]">
        <span>{recipe.minutes} 分钟</span>
        <span className="flex items-center gap-1 font-medium text-[color:var(--foreground)] group-hover:gap-2 transition-all">
          查看经验包 <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
