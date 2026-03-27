import { ArrowRight } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { RecipeCard } from "@/components/RecipeCard";
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

  return (
    <Layout accent={track.color}>
      {/* Hero */}
      <section className="pt-16 sm:pt-24">
        <div className="flex gap-8">
          {/* Left accent bar */}
          <div className="hidden w-1 shrink-0 sm:block" style={{ backgroundColor: track.color }} />

          <div className="flex-1">
            <p className="eyebrow mb-4" style={{ color: track.color }}>{track.name}</p>
            <h1 className="font-serif text-4xl leading-[1.06] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              {track.summary}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[color:var(--muted-foreground)]">
              {track.promise}
            </p>
          </div>
        </div>

        {/* Entry signal */}
        <div className="mt-12 border-t border-[color:var(--border)] pt-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
            <div>
              <p className="eyebrow mb-2">进入方式</p>
              <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">{track.entryQuestion}</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-3">适合谁</p>
                <ul className="space-y-2">
                  {track.starterAudience.map((audience) => (
                    <li key={audience} className="flex gap-2.5 text-sm text-[color:var(--foreground)]">
                      <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: track.color }} />
                      <span>{audience}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-3">信号词</p>
                <div className="flex flex-wrap gap-2">
                  {track.signatureSignals.map((signal) => (
                    <span
                      key={signal}
                      className="inline-flex items-center rounded-sm border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted-foreground)] border-[color:var(--border-strong)]"
                    >
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recipes */}
      <section className="section-space">
        <p className="eyebrow mb-8">这条路径的经验包</p>
        <div className="grid gap-px bg-[color:var(--border)] lg:grid-cols-3">
          {trackRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>

      {/* Next track */}
      <section className="section-space">
        <div className="flex items-center justify-between border-t border-[color:var(--border)] pt-8">
          <div>
            <p className="eyebrow mb-1">Next Track</p>
            <p className="font-serif text-lg tracking-[-0.02em]">{nextTrack.summary}</p>
          </div>
          <Link
            to={nextTrack.path}
            className="flex items-center gap-2 text-sm font-medium text-[color:var(--foreground)] hover:opacity-60 transition-opacity"
          >
            去看 {nextTrack.name} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
