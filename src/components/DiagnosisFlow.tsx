import { useState } from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recipes } from "@/data";

type Step1 = "result" | "capability" | "expression" | "system";
type Step2 = "simple" | "install" | "invest";

const step1Options: { value: Step1; label: string; desc: string }[] = [
  { value: "result", label: "拿不到结果", desc: "想做成一件事，但 OpenClaw 跑来跑去没跑通" },
  { value: "capability", label: "工具能力不够", desc: "感觉 OpenClaw 缺少某种能力，比如抓网页、处理文件" },
  { value: "expression", label: "说不清任务", desc: "想法有了，但不知道怎么表达才能让 OpenClaw 真正执行" },
  { value: "system", label: "想接成系统", desc: "单点已经会了，想把几个能力串起来变成一个工作骨架" },
];

const step2Options: { value: Step2; label: string; desc: string }[] = [
  { value: "simple", label: "越简单越好", desc: "我想马上开始，不想先装东西" },
  { value: "install", label: "愿意先装个工具", desc: "如果能力扩展之后体验更好，我愿意" },
  { value: "invest", label: "愿意花 30 分钟", desc: "我愿意先投入一点，换来更稳的结果" },
];

const recommend: Record<Step1, Record<Step2, string>> = {
  result:     { simple: "C1", install: "C1", invest: "C1" },
  capability: { simple: "E1", install: "E1", invest: "E1" },
  expression: { simple: "D1", install: "D1", invest: "D1" },
  system:     { simple: "O1", install: "O1", invest: "O1" },
};

const reasons: Record<Step1, string> = {
  result:     "你现在最需要先拿到一个具体结果建立信心，会议纪要整理是验证门槛最低、结果感最强的起点。",
  capability: "你已经遇到了能力边界，Scrapling 抓取增强是最值得优先装的单个能力扩展。",
  expression: "你卡在表达层，定时任务表达校准专门训练如何把模糊想法变成可执行结构。",
  system:     "你准备好了接系统，一人情报公司骨架是把单点能力串起来的最小完整框架。",
};

export function DiagnosisFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [s1, setS1] = useState<Step1 | null>(null);
  const [s2, setS2] = useState<Step2 | null>(null);

  const recipeId = s1 && s2 ? recommend[s1][s2] : null;
  const recipe = recipes.find((r) => r.id === recipeId);

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="accent">Diagnosis</Badge>
        <div className="flex gap-1">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-1.5 w-6 rounded-full transition-colors"
              style={{ background: n <= step ? "var(--accent-color, var(--care))" : "var(--border)" }}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold text-[color:var(--foreground)]">你现在最卡的是哪一步？</p>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-1">选一个，我帮你找最合适的第一个经验包。</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {step1Options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setS1(opt.value); setStep(2); }}
                className="rounded-xl border border-[color:var(--border)] bg-white/70 p-4 text-left transition-all hover:border-[color:var(--foreground)] hover:shadow-sm active:scale-[0.97] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--foreground)]"
              >
                <p className="text-sm font-semibold text-[color:var(--foreground)]">{opt.label}</p>
                <p className="mt-1 text-xs leading-6 text-[color:var(--muted-foreground)]">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
          >
            <ChevronLeft className="h-3 w-3" /> 返回
          </button>
          <div>
            <p className="text-base font-semibold text-[color:var(--foreground)]">你愿意接受多复杂的第一步？</p>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-1">这决定我推荐的路径深度。</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {step2Options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setS2(opt.value); setStep(3); }}
                className="rounded-xl border border-[color:var(--border)] bg-white/70 p-4 text-left transition-all hover:border-[color:var(--foreground)] hover:shadow-sm active:scale-[0.97] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--foreground)]"
              >
                <p className="text-sm font-semibold text-[color:var(--foreground)]">{opt.label}</p>
                <p className="mt-1 text-xs leading-6 text-[color:var(--muted-foreground)]">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && recipe && s1 && (
        <div className="space-y-4">
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-1 text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
          >
            <ChevronLeft className="h-3 w-3" /> 返回
          </button>
          <div>
            <p className="text-base font-semibold text-[color:var(--foreground)]">你的第一个经验包是：</p>
          </div>
          <div className="rounded-xl border-2 border-[color:var(--accent-color,var(--care))] bg-white/80 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="accent">{recipe.id}</Badge>
              <span className="text-xs text-[color:var(--muted-foreground)]">{recipe.minutes} 分钟 · 风险 {recipe.riskLevel}</span>
            </div>
            <p className="text-lg font-semibold leading-7 text-[color:var(--foreground)]">{recipe.title}</p>
            <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">{reasons[s1]}</p>
            <Button asChild className="w-full justify-between">
              <Link to={`/recipes/${recipe.slug}`}>
                开始这个经验包
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <button
            onClick={() => { setStep(1); setS1(null); setS2(null); }}
            className="text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] underline"
          >
            重新诊断
          </button>
        </div>
      )}
    </div>
  );
}
