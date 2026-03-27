import type { CSSProperties, PropsWithChildren } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LayoutProps {
  accent?: string;
}

export function Layout({
  children,
  accent = "var(--care)",
}: PropsWithChildren<LayoutProps>) {
  const navItems = [
    { to: "/", label: "首页" },
    { to: "/starter-pack", label: "Starter Pack" },
    { to: "/tracks/care", label: "四条路径" },
    { to: "/about", label: "关于 AuraClaw" },
  ];

  return (
    <div className="page-shell" style={{ "--accent-color": accent } as CSSProperties}>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_52%)]" />

      <header className="sticky top-4 z-40">
        <div className="flex items-center justify-between rounded-full border border-[color:var(--border)] bg-white/78 px-3 py-3 shadow-[0_26px_64px_-42px_rgba(29,31,32,0.65)] backdrop-blur-xl sm:px-5">
          <NavLink className="flex items-center gap-3" to="/">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white shadow-[0_16px_36px_-22px_rgba(29,31,32,0.72)]"
              style={{ backgroundColor: accent }}
            >
              A
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold tracking-[0.18em] text-[color:var(--foreground)] uppercase">AuraClaw</p>
              <p className="text-xs text-[color:var(--muted-foreground)]">OpenClaw 经验进化平台</p>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center px-4 py-[10px] text-sm font-medium text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)] min-h-[44px]",
                    isActive && "text-[color:var(--foreground)] after:absolute after:bottom-0 after:left-4 after:right-4 after:h-[2px] after:rounded-full after:bg-[color:var(--accent-color)]",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Button asChild size="sm" className="hidden sm:inline-flex">
            <NavLink to="/starter-pack">
              开始培养
              <ArrowUpRight className="h-4 w-4" />
            </NavLink>
          </Button>

          <Button asChild size="sm" className="sm:hidden">
            <NavLink to="/starter-pack">
              <Sparkles className="h-4 w-4" />
            </NavLink>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="mt-8 flex flex-col gap-16 sm:mt-12 sm:gap-24">{children}</div>
      </main>
    </div>
  );
}
