import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  body?: string;
  className?: string;
}

export function SectionHeading({ eyebrow, title, body, className }: SectionHeadingProps) {
  return (
    <div className={cn("section-intro", className)}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="section-title mt-3">{title}</h2>
      {body ? <p className="section-copy">{body}</p> : null}
    </div>
  );
}
