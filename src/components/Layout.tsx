import type { CSSProperties, PropsWithChildren } from "react";
import { Menu, X } from "lucide-react";
import { useState } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: "/", label: "首页" },
    { to: "/starter-pack", label: "Starter Pack" },
    { to: "/tracks/care", label: "四条路径" },
    { to: "/about", label: "关于" },
  ];

  return (
    <div className="page-shell" style={{ "--accent-color": accent } as CSSProperties}>
      <header className="sticky top-0 z-40 -mx-4 bg-[color:var(--background)] sm:-mx-6 lg:-mx-8">
        <div className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-5 sm:px-6 lg:px-8">
          <NavLink className="flex items-center gap-3" to="/">
            <div
              className="flex h-8 w-8 items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              A
            </div>
            <span className="text-base font-bold tracking-[0.14em] text-[color:var(--foreground)] uppercase">AuraClaw</span>
          </NavLink>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "text-base py-2 transition-colors text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]",
                    isActive && "font-semibold text-[color:var(--foreground)]",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Button asChild variant="outline" size="sm" className="hidden md:inline-flex text-sm font-semibold">
            <NavLink to="/starter-pack">开始培养 →</NavLink>
          </Button>

          <button
            className="flex h-8 w-8 items-center justify-center text-[color:var(--foreground)] md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="菜单"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-b border-[color:var(--border)] bg-[color:var(--background)] px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded px-3 py-3 text-base transition-colors text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--panel-muted)]",
                      isActive && "font-semibold text-[color:var(--foreground)] bg-[color:var(--panel-muted)]",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="flex flex-1 flex-col">
        <div className="flex flex-col gap-20 sm:gap-28">{children}</div>
      </main>
    </div>
  );
}
