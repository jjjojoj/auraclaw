import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { AdminSession } from "@/types";

interface LoginResponse {
  ok?: boolean;
  error?: string;
  lockedUntil?: string;
  attemptsRemaining?: number;
  session?: AdminSession;
}

interface SessionResponse {
  authenticated: boolean;
  session?: AdminSession;
}

function formatLockMessage(lockedUntil?: string) {
  if (!lockedUntil) {
    return "登录尝试过多，请稍后再试。";
  }

  const value = new Date(lockedUntil);
  if (Number.isNaN(value.getTime())) {
    return "登录尝试过多，请稍后再试。";
  }

  return `登录尝试过多，请在 ${value.toLocaleString("zh-CN", { hour12: false })} 后重试。`;
}

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session");
        if (!response.ok) {
          throw new Error("会话检查失败");
        }

        const data = (await response.json()) as SessionResponse;
        if (!active) return;

        if (data.authenticated) {
          navigate("/admin/review", { replace: true });
          return;
        }
      } catch {
        // Ignore and show login form.
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = (await response.json()) as LoginResponse;

      if (response.status === 429) {
        setError(formatLockMessage(data.lockedUntil));
        return;
      }

      if (!response.ok) {
        const detail =
          data.attemptsRemaining !== undefined && data.attemptsRemaining >= 0
            ? `还可尝试 ${data.attemptsRemaining} 次。`
            : "";
        setError([data.error || "登录失败。", detail].filter(Boolean).join(" "));
        return;
      }

      navigate("/admin/review", { replace: true });
    } catch {
      setError("后台登录暂时不可用，请稍后再试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell min-h-screen items-center justify-center">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="border border-[color:var(--border)] bg-[color:var(--panel)] p-8 sm:p-10">
          <p className="eyebrow mb-4">AuraClaw Admin</p>
          <h1 className="font-serif text-4xl leading-[1.04] tracking-[-0.04em] text-[color:var(--foreground)] sm:text-5xl">
            后台审核区
          </h1>
          <p className="mt-6 text-base leading-8 text-[color:var(--muted-foreground)]">
            这里不对普通访客开放。OpenClaw 负责投递候选内容，你负责批准、拒绝、归档和回溯。
          </p>

          <div className="mt-8 space-y-4 border-t border-[color:var(--border)] pt-6">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-[color:var(--opc)]" />
              <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
                已启用登录保护与失败锁定，连续输错会暂时封锁登录入口，降低密码爆破风险。
              </p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 h-4 w-4 shrink-0 text-[color:var(--extension)]" />
              <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
                原始采集文件不会被覆盖，所有审核动作都会写入历史记录，方便回溯。
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              to="/"
              className="text-sm font-medium text-[color:var(--foreground)] underline-offset-4 hover:underline"
            >
              返回前台网站
            </Link>
          </div>
        </section>

        <section className="border border-[color:var(--border-strong)] bg-[color:var(--background)] p-8 shadow-[0_24px_60px_-40px_rgba(15,15,14,0.4)] sm:p-10">
          <p className="eyebrow mb-4">Sign In</p>
          <h2 className="font-serif text-3xl tracking-[-0.03em] text-[color:var(--foreground)]">
            进入内容后台
          </h2>
          <p className="mt-4 text-sm leading-7 text-[color:var(--muted-foreground)]">
            只有管理员账号可以访问审核区。登录后才会显示候选内容和审核动作。
          </p>

          {checking ? (
            <div className="mt-8 border border-[color:var(--border)] bg-[color:var(--panel)] p-5 text-sm text-[color:var(--muted-foreground)]">
              正在检查现有后台会话…
            </div>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[color:var(--foreground)]">管理员账号</span>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm outline-none"
                  placeholder="输入后台用户名"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-[color:var(--foreground)]">管理员密码</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm outline-none"
                  placeholder="输入后台密码"
                />
              </label>

              {error ? (
                <div className="border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-4 py-3 text-sm leading-7 text-[color:var(--foreground)]">
                  {error}
                </div>
              ) : null}

              <Button type="submit" disabled={submitting} className="w-full rounded-full">
                {submitting ? "正在登录…" : "进入审核后台"}
              </Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
