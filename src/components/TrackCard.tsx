import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Track } from "@/types";

interface TrackCardProps {
  track: Track;
}

export function TrackCard({ track }: TrackCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="subtle">{track.name}</Badge>
          <span
            className="h-3 w-3 rounded-full shadow-[0_0_0_6px_rgba(255,255,255,0.65)]"
            style={{ backgroundColor: track.color }}
          />
        </div>
        <CardTitle className="text-xl leading-8">{track.summary}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">{track.heroNote}</p>

        <div className="flex flex-wrap gap-2">
          {track.signatureSignals.map((signal) => (
            <Badge key={signal} variant="default">
              {signal}
            </Badge>
          ))}
        </div>

        <Button asChild className="w-full justify-between" variant="secondary">
          <Link to={track.path}>
            进入这条路径
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
