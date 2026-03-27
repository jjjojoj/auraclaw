import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="relative flex h-full flex-col overflow-hidden" style={{ borderTop: "3px solid var(--accent-color, var(--border))" }}>
      {isCompleted && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
          <CheckCircle2 className="h-3 w-3" />
          已跑通
        </div>
      )}
      <CardHeader className="gap-4">
        <div className="flex items-center justify-between gap-3">
          {recipe.starterLabel ? <Badge variant="accent">{recipe.starterLabel}</Badge> : <div />}
          <div className="flex items-center gap-3 text-xs text-[color:var(--muted-foreground)]">
            <span>{recipe.minutes} 分钟</span>
            <span>风险 {recipe.riskLevel}</span>
          </div>
        </div>
        <CardTitle className="text-xl leading-8">{recipe.title}</CardTitle>
        <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">{recipe.promise}</p>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3 text-sm leading-7 text-[color:var(--foreground)]">
          {highlights.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[color:var(--accent-color)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full justify-between" variant="outline">
          <Link to={`/recipes/${recipe.slug}`}>
            查看经验包
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
