import type { PropsWithChildren } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  username: string;
  title: string;
  intro: string;
}

export function AdminLayout({
  children,
  username,
  title,
  intro,
}: PropsWithChildren<AdminLayoutProps>) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } finally {
      navigate("/admin/login", { replace: true });
      setLoggingOut(false);
    }
  }

  return (
    <div className="page-shell min-h-screen">
      <header className="sticky top-0 z-40 -mx-4 px-4 pt-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="rounded-[24px] border border-[color:var(--border-strong)] bg-[color:var(--background)]/94 p-4 shadow-[0_18px_40px_-28px_rgba(15,15,14,0.18)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="eyebrow mb-3">AuraClaw Admin</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="brand-wordmark block text-[color:var(--foreground)]">AuraClaw</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1 text-xs font-semibold text-[color:var(--muted-foreground)]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  已登录
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-left lg:items-end lg:text-right">
              <div>
                <p className="text-sm font-semibold text-[color:var(--foreground)]">{title}</p>
                <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">{intro}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                  {username}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loggingOut}
                  className="rounded-full"
                  onClick={() => void handleLogout()}
                >
                  <LogOut className="h-4 w-4" />
                  退出后台
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="flex flex-col gap-16 pb-16 sm:gap-20">{children}</div>
      </main>
    </div>
  );
}
