import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Track } from "@/types";

interface TrackCardProps {
  track: Track;
  index?: number;
}

export function TrackCard({ track, index = 0 }: TrackCardProps) {
  return (
    <Link
      to={track.path}
      className="group flex gap-6 border-t border-[color:var(--border)] py-6 transition-colors hover:bg-[color:var(--panel-muted)] px-1"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center text-xs font-semibold text-white mt-0.5"
        style={{ backgroundColor: track.color }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)] mb-1.5">
              {track.name}
            </p>
            <h3 className="font-serif text-lg leading-snug tracking-[-0.02em] text-[color:var(--foreground)] mb-2">
              {track.summary}
            </h3>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--muted-foreground)] mt-1 group-hover:translate-x-0.5 transition-transform" />
        </div>
        <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">{track.heroNote}</p>
      </div>
    </Link>
  );
}
