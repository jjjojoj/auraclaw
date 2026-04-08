import { CheckCircle2, Circle } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import { CopyButton } from "@/components/CopyButton";
import { Layout } from "@/components/Layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { recipes, tracks } from "@/data";
import { useRecipeProgress } from "@/lib/useRecipeProgress";

function ProgressBar({ current }: { current: "prepare" | "execute" | "validate" | "done" }) {
  const steps = ["准备", "执行", "验证", "完成"];
  const idx = ["prepare", "execute", "validate", "done"].indexOf(current);
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="h-1.5 w-10 rounded-full transition-all"
              style={{
                background:
                  i < idx
                    ? "var(--success)"
                    : i === idx
                      ? "var(--accent-color, var(--foreground))"
                      : "var(--border-strong)",
              }}
            />
            <span
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ color: i === idx ? "var(--foreground)" : "var(--step-pending)" }}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && <div className="mb-5 h-px w-3" style={{ background: "var(--border)" }} />}
        </div>
      ))}
    </div>
  );
}

export function RecipePage() {
  const { slug } = useParams();
  const recipe = recipes.find((item) => item.slug === slug);

  if (!recipe) {
    return <Navigate to="/" replace />;
  }

  const track = tracks.find((item) => item.id === recipe.trackId);
  const prepareChecklist = recipe.prepareChecklist ?? recipe.prerequisites;
  const deliverables = recipe.youWillGet ?? recipe.passCriteria;
  const executionFlow = recipe.executionFlow ?? recipe.passCriteria;
  const validationSteps = recipe.validationSteps ?? recipe.passCriteria;
  const fallbackPlan =
    recipe.fallbackPlan ?? ["先缩小任务范围，再验证最小可行结果", "如果还卡住，先明确卡在能力还是表达"];
  const pitfalls =
    recipe.pitfalls ?? [
      { issue: "输入过于含糊", fix: "先补充目标、范围和你想拿到的结果。" },
      { issue: "一开始就上复杂任务", fix: "先用页面里的测试样例跑一遍，再换成自己的内容。" },
    ];
  const bestFor =
    recipe.bestFor ?? recipe.targetRoles.map((role) => `${role} 想先拿一个稳定、可复用的小结果`);

  const {
    isCompleted,
    completedAt,
    stepsChecked,
    toggleStep,
    markComplete,
  } = useRecipeProgress(recipe.id);

  const totalValidation = validationSteps.length;
  const checkedValidation = stepsChecked.filter((i) => i >= 1000).length;
  const allValidated = checkedValidation >= totalValidation;

  const totalPrepare = prepareChecklist.length;
  const checkedPrepare = stepsChecked.filter((i) => i < 1000).length;

  const currentPhase = isCompleted
    ? "done"
    : allValidated
      ? "validate"
      : checkedPrepare > 0
        ? "execute"
        : "prepare";

  return (
    <Layout accent={track?.color}>
      {/* Header */}
      <section className="pt-12 sm:pt-20">
        <div className="flex gap-6">
          <div className="hidden w-0.5 shrink-0 sm:block" style={{ backgroundColor: track?.color ?? "var(--border)" }} />
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                {track?.name}
              </span>
              <span className="text-[10px] text-[color:var(--border-strong)]">/</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                {recipe.id}
              </span>
              {recipe.starterLabel && (
                <Badge variant="accent">{recipe.starterLabel}</Badge>
              )}
            </div>
            <h1 className="font-serif text-3xl leading-[1.1] tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              {recipe.title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-[color:var(--muted-foreground)]">
              {recipe.promise}
            </p>
            <div className="flex flex-wrap gap-6 text-xs text-[color:var(--muted-foreground)]">
              <span>{recipe.minutes} 分钟</span>
              <span>风险 {recipe.riskLevel}</span>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <ProgressBar current={currentPhase} />
        </div>
      </section>

      {/* Main two-column */}
      <section className="section-space grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
        {/* Left — execution main line */}
        <div className="space-y-10">
          {/* Step 1 — 准备 */}
          <div className="flex gap-5">
            <div className="flex flex-col items-center gap-1">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{
                  background: checkedPrepare > 0 ? "var(--success)" : "var(--foreground)",
                  color: "var(--primary-foreground)",
                }}
              >
                {checkedPrepare > 0 ? "✓" : "1"}
              </span>
              <div className="w-px flex-1 bg-[color:var(--border)]" />
            </div>
            <div className="flex-1 pb-10">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">Step 1 · 准备</p>
              <h2 className="mb-6 font-serif text-xl tracking-[-0.02em]">先确认这几个前提</h2>
              <ul className="space-y-3">
                {prepareChecklist.map((item, i) => {
                  const checked = stepsChecked.includes(i);
                  return (
                    <li
                      key={item}
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-transparent px-3 py-2 transition-colors hover:border-[color:var(--border)] hover:bg-[color:var(--panel-muted)]  "
                      onClick={() => toggleStep(i)}
                    >
                      {checked ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--success)" }} />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--border-strong)]" />
                      )}
                      <span
                        className="text-sm leading-7"
                        style={{ color: checked ? "var(--step-done)" : "var(--foreground)" }}
                      >
                        {item}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Step 2 — 执行 */}
          <div className="flex gap-5">
            <div className="flex flex-col items-center gap-1">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{
                  background: "var(--foreground)",
                  color: "var(--primary-foreground)",
                }}
              >
                2
              </span>
              <div className="w-px flex-1 bg-[color:var(--border)]" />
            </div>
            <div className="flex-1 pb-10">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">Step 2 · 执行</p>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-xl tracking-[-0.02em]">
                  {recipe.shortestCommand ? `最短命令：${recipe.shortestCommand}` : "把这段话复制给 OpenClaw"}
                </h2>
                <CopyButton text={recipe.copyBlock} size="sm" variant="outline" />
              </div>
              <pre className="code-surface overflow-x-auto">
                <code>{recipe.copyBlock}</code>
              </pre>
            </div>
          </div>

          {/* Step 3 — 验证 */}
          <div className="flex gap-5">
            <div className="flex flex-col items-center gap-1">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{
                  background: allValidated ? "var(--success)" : "var(--foreground)",
                  color: "var(--primary-foreground)",
                }}
              >
                {allValidated ? "✓" : "3"}
              </span>
              {!isCompleted && <div className="w-px flex-1 bg-[color:var(--border)]" />}
            </div>
            <div className="flex-1 pb-4">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">Step 3 · 验证</p>
              <h2 className="mb-6 font-serif text-xl tracking-[-0.02em]">跑完之后对照这几条</h2>
              <ul className="space-y-3">
                {validationSteps.map((item, i) => {
                  const key = 1000 + i;
                  const checked = stepsChecked.includes(key);
                  return (
                    <li
                      key={item}
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-transparent px-3 py-2 transition-colors hover:border-[color:var(--border)] hover:bg-[color:var(--panel-muted)]"
                      onClick={() => toggleStep(key)}
                    >
                      {checked ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--success)" }} />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--border-strong)]" />
                      )}
                      <span
                        className="text-sm leading-7"
                        style={{ color: checked ? "var(--step-done)" : "var(--foreground)" }}
                      >
                        {item}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6">
                {isCompleted ? (
                  <p className="text-sm font-medium" style={{ color: "var(--success)" }}>
                    ✓ 已跑通 · {completedAt ? new Date(completedAt).toLocaleDateString("zh-CN") : ""}
                  </p>
                ) : (
                  <Button
                    disabled={!allValidated}
                    onClick={markComplete}
                    style={allValidated ? { background: "var(--success)", color: "#fff" } : {}}
                  >
                    {allValidated
                      ? "标记为已跑通 ✓"
                      : `还有 ${totalValidation - checkedValidation} 条验证未完成`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right — reference accordion */}
        <div className="space-y-0 border-t border-[color:var(--border)] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 pt-8">
          <Accordion type="multiple">
            <AccordionItem value="deliverables">
              <AccordionTrigger className="text-sm">你会拿到什么</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {deliverables.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-7">
                      <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--foreground)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="execution">
              <AccordionTrigger className="text-sm">它会怎么执行</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {executionFlow.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-7">
                      <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--foreground)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            {recipe.outputPreview ? (
              <AccordionItem value="preview">
                <AccordionTrigger className="text-sm">结果预览</AccordionTrigger>
                <AccordionContent>
                  <pre className="rounded-md border border-[color:var(--border)] bg-[color:var(--panel-muted)] p-4 text-xs leading-6 whitespace-pre-wrap">
                    <code>{recipe.outputPreview}</code>
                  </pre>
                </AccordionContent>
              </AccordionItem>
            ) : null}

            {recipe.dependencies?.length ? (
              <AccordionItem value="dependencies">
                <AccordionTrigger className="text-sm">会用到什么</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-4">
                    {recipe.dependencies.map((dependency) => (
                      <li key={`${dependency.name}-${dependency.source}`}>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)] mb-1">
                          {dependency.kind}
                        </p>
                        <p className="text-sm font-medium text-[color:var(--foreground)]">{dependency.name}</p>
                        <p className="mt-1 text-sm leading-7 text-[color:var(--muted-foreground)]">{dependency.summary}</p>
                        <a
                          href={dependency.source}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-sm font-medium text-[color:var(--foreground)] underline underline-offset-4"
                        >
                          查看来源
                        </a>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ) : null}

            {recipe.sourceTips?.length ? (
              <AccordionItem value="sources">
                <AccordionTrigger className="text-sm">来源提醒</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {recipe.sourceTips.map((item) => (
                      <li key={item} className="flex gap-2 text-sm leading-7">
                        <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--muted-foreground)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ) : null}

            <AccordionItem value="pitfalls">
              <AccordionTrigger className="text-sm">常见踩坑</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-4">
                  {pitfalls.map((p) => (
                    <li key={p.issue}>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)] mb-1">{p.issue}</p>
                      <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">{p.fix}</p>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="fallback">
              <AccordionTrigger className="text-sm">失败了怎么退</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {fallbackPlan.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-7">
                      <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--muted-foreground)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bestfor">
              <AccordionTrigger className="text-sm">最适合的情况</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {bestFor.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-7">
                      <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--muted-foreground)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="nextstep" className="border-b-0">
              <AccordionTrigger className="text-sm">成功后下一步</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-7">{recipe.nextStep}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {recipe.sampleInput && (
            <div className="mt-8 border-t border-[color:var(--border)] pt-6">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                First Run
              </p>
              <p className="mb-3 text-sm font-medium">{recipe.sampleInput.title}</p>
              <pre className="rounded-md border border-[color:var(--border)] bg-[color:var(--panel-muted)] p-4 text-xs leading-6 whitespace-pre-wrap">
                <code>{recipe.sampleInput.content}</code>
              </pre>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
