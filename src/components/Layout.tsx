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
      <header className="sticky top-0 z-40 -mx-4 px-4 pt-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="rounded-[24px] border border-[color:var(--border-strong)] bg-[color:var(--background)]/94 p-3 shadow-[0_18px_40px_-28px_rgba(15,15,14,0.18)] backdrop-blur">
          <div className="grid gap-3 md:grid-cols-[auto_1fr_auto] md:items-center">
            <NavLink className="min-w-max" to="/">
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3">
                <span className="brand-wordmark block text-[color:var(--foreground)]">AuraClaw</span>
              </div>
            </NavLink>

            <nav className="hidden min-w-0 grid-cols-4 gap-1 rounded-[18px] border border-[color:var(--border)] bg-[color:var(--panel)] p-1 md:grid">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center justify-center gap-3 rounded-[14px] px-4 py-3 transition-all",
                      isActive
                        ? "bg-[color:var(--accent-color)] text-white shadow-[0_12px_24px_-18px_rgba(15,15,14,0.5)]"
                        : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--panel-muted)] hover:text-[color:var(--foreground)]",
                    )
                  }
                >
                  <span className="text-[1.02rem] font-semibold tracking-[0.01em]">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center justify-end gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden rounded-[14px] border-[color:var(--border)] bg-[color:var(--panel)] px-4 text-sm font-semibold md:inline-flex"
              >
                <NavLink to="/starter-pack">开始培养 →</NavLink>
              </Button>

              <button
                className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[color:var(--border)] bg-[color:var(--panel)] text-[color:var(--foreground)] md:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="菜单"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="mt-3 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--panel)] p-2 md:hidden">
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-[14px] px-4 py-3 text-base transition-colors",
                        isActive
                          ? "bg-[color:var(--accent-color)] text-white"
                          : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--panel-muted)] hover:text-[color:var(--foreground)]",
                      )
                    }
                  >
                    <span className="text-[1.02rem] font-semibold tracking-[0.01em]">{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <Button asChild className="mt-2 w-full rounded-[14px]" size="sm">
                <NavLink onClick={() => setMobileOpen(false)} to="/starter-pack">
                  开始培养 →
                </NavLink>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="flex flex-col gap-20 sm:gap-28">{children}</div>
      </main>
    </div>
  );
}
