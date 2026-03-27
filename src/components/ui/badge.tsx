import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-[10px] font-medium tracking-[0.16em] uppercase",
  {
    variants: {
      variant: {
        default:
          "border-[color:var(--border-strong)] bg-transparent text-[color:var(--muted-foreground)]",
        accent:
          "border-transparent bg-[color:var(--primary-soft)] text-[color:var(--foreground)]",
        subtle:
          "border-[color:var(--border)] bg-[color:var(--panel-muted)] text-[color:var(--muted-foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
