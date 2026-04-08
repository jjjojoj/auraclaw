import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import type { AdminSession } from "@/types";

interface SessionResponse {
  authenticated: boolean;
  session?: AdminSession;
}

export function AdminGate() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session", {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error("后台会话校验失败");
        }

        const data = (await response.json()) as SessionResponse;
        if (!active) return;

        setSession(data.authenticated ? data.session ?? null : null);
      } catch {
        if (!active) return;
        setSession(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-shell min-h-screen items-center justify-center">
        <div className="mx-auto w-full max-w-md border border-[color:var(--border)] bg-[color:var(--panel)] p-8 text-center">
          <p className="eyebrow mb-3">Admin</p>
          <h1 className="font-serif text-3xl tracking-[-0.03em] text-[color:var(--foreground)]">
            正在确认后台会话
          </h1>
          <p className="mt-4 text-sm leading-7 text-[color:var(--muted-foreground)]">
            只有通过登录的管理员才可以访问审核后台。
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet context={session} />;
}
