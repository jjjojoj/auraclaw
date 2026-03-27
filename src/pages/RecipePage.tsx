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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recipes, tracks } from "@/data";
import { useRecipeProgress } from "@/lib/useRecipeProgress";

function ProgressBar({ current }: { current: "prepare" | "execute" | "validate" | "done" }) {
  const steps = ["准备", "执行", "验证", "完成"];
  const idx = ["prepare", "execute", "validate", "done"].indexOf(current);
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex items-center justify-center rounded-full font-semibold transition-all ${i === idx ? "h-8 w-8 text-sm shadow-md" : "h-6 w-6 text-xs"}`}
              style={{
                background: i < idx ? "var(--success)" : i === idx ? "var(--accent-color, var(--foreground))" : "var(--border)",
                color: i <= idx ? "#fff" : "var(--step-pending)",
              }}
            >
              {i < idx ? "✓" : i + 1}
            </div>
            <span className="text-xs" style={{ color: i === idx ? "var(--foreground)" : "var(--step-pending)" }}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="mb-4 h-[2px] w-8 sm:w-12" style={{ background: i < idx ? "var(--success)" : "var(--border)" }} />
          )}
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
      {/* 页头 */}
      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">{recipe.id}</Badge>
            <Badge variant="subtle">{track?.name}</Badge>
            {recipe.starterLabel ? <Badge>{recipe.starterLabel}</Badge> : null}
          </div>
          <div className="space-y-4">
            <h1 className="max-w-4xl font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">
              {recipe.title}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-[color:var(--foreground)]">{recipe.promise}</p>
            <p className="max-w-3xl text-base leading-8 text-[color:var(--muted-foreground)]">{recipe.salesPitch ?? recipe.whyItMatters}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="gap-3">
            <Badge variant="subtle">Pack Snapshot</Badge>
            <CardTitle className="text-2xl leading-9">这包的成色</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[22px] border border-[color:var(--border)] bg-white/70 p-4">
              <p className="eyebrow">时长</p>
              <p className="mt-2 text-lg font-semibold">{recipe.minutes} 分钟</p>
            </div>
            <div className="rounded-[22px] border border-[color:var(--border)] bg-white/70 p-4">
              <p className="eyebrow">风险等级</p>
              <p className="mt-2 text-lg font-semibold">{recipe.riskLevel}</p>
            </div>
            <div className="rounded-[22px] border border-[color:var(--border)] bg-white/70 p-4 sm:col-span-2">
              <p className="eyebrow">适合谁</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted-foreground)]">{recipe.targetRoles.join(" / ")}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 进度条 */}
      <div className="section-space">
        <ProgressBar current={currentPhase} />
      </div>

      {/* 主体：左栏执行主线 + 右栏参考 */}
      <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_360px]">
        {/* 左栏：执行主线 */}
        <div className="space-y-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">

          {/* 完成状态横幅 */}
          {isCompleted && (
            <div className="flex items-center gap-3 rounded-2xl border px-5 py-4" style={{ borderColor: "var(--success)", background: "var(--success-soft)" }}>
              <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "var(--success)" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>已跑通</p>
                {completedAt && <p className="text-xs" style={{ color: "var(--success)" }}>{completedAt}</p>}
              </div>
            </div>
          )}

          {/* 准备清单 */}
          <Card>
            <CardHeader className="gap-3">
              <Badge variant="subtle">Step 1 · 准备</Badge>
              <CardTitle className="text-xl leading-8">开始之前先确认这几件事</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {prepareChecklist.map((item, i) => {
                  const checked = stepsChecked.includes(i);
                  return (
                    <li
                      key={item}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-transparent p-2 transition-all hover:border-[color:var(--border)] hover:bg-[color:var(--panel-muted)]"
                      onClick={() => toggleStep(i)}
                    >
                      {checked ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--success)" }} />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--accent-color, var(--foreground))" }} />
                      )}
                      <span
                        className="text-sm leading-7"
                        style={{ color: checked ? "var(--step-done)" : "var(--foreground)", textDecoration: checked ? "line-through" : "none" }}
                      >
                        {item}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          {/* 执行流 */}
          <Card>
            <CardHeader className="gap-3">
              <Badge variant="subtle">Step 2 · 执行</Badge>
              <CardTitle className="text-xl leading-8">按这个顺序跑</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {executionFlow.map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                      style={{ background: "var(--primary-soft)", color: "var(--foreground)" }}
                    >
                      {i + 1}
                    </div>
                    <p className="text-sm leading-7 text-[color:var(--foreground)]">{step}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* 复制块 */}
          <Card>
            <CardHeader className="gap-3">
              <Badge variant="subtle">Step 3 · 复制给 OpenClaw</Badge>
              <CardTitle className="text-xl leading-8">
                {recipe.shortestCommand ? `最短命令：${recipe.shortestCommand}` : "把这段话复制给 OpenClaw"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CopyButton text={recipe.copyBlock} />
              <pre className="code-surface overflow-x-auto">
                <code>{recipe.copyBlock}</code>
              </pre>
            </CardContent>
          </Card>

          {/* 验证清单 */}
          <Card style={allValidated && !isCompleted ? { borderColor: "var(--progress)", boxShadow: "0 0 0 1px var(--progress)" } : {}}>
            <CardHeader className="gap-3">
              <Badge variant="subtle">Step 4 · 验证</Badge>
              <CardTitle className="text-xl leading-8">跑完之后对照这几条</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {validationSteps.map((item, i) => {
                  const key = 1000 + i;
                  const checked = stepsChecked.includes(key);
                  return (
                    <li
                      key={item}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-transparent p-2 transition-all hover:border-[color:var(--border)] hover:bg-[color:var(--panel-muted)]"
                      onClick={() => toggleStep(key)}
                    >
                      {checked ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--success)" }} />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--accent-color, var(--foreground))" }} />
                      )}
                      <span
                        className="text-sm leading-7"
                        style={{ color: checked ? "var(--step-done)" : "var(--foreground)", textDecoration: checked ? "line-through" : "none" }}
                      >
                        {item}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {!isCompleted && (
                <Button
                  className="w-full"
                  disabled={!allValidated}
                  onClick={markComplete}
                  style={allValidated ? { background: "var(--success)", color: "#fff" } : {}}
                >
                  {allValidated ? "标记为已跑通" : `还有 ${totalValidation - checkedValidation} 条验证未完成`}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右栏：参考信息 */}
        <div className="space-y-4">
          <Accordion collapsible type="single">
            {deliverables.length > 0 && (
              <AccordionItem value="deliverables">
                <AccordionTrigger className="text-sm font-medium">你会拿到什么</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {deliverables.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-7">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent-color)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {recipe.dependencies && recipe.dependencies.length > 0 && (
              <AccordionItem value="deps">
                <AccordionTrigger className="text-sm font-medium">需要装什么</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {recipe.dependencies.map((dep) => (
                      <div key={dep.name} className="rounded-xl border border-[color:var(--border)] bg-white/60 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{dep.name}</p>
                          <Badge variant="subtle">{dep.kind}</Badge>
                        </div>
                        <p className="mt-1 text-xs leading-6 text-[color:var(--muted-foreground)]">{dep.summary}</p>
                        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">{dep.source}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {pitfalls.length > 0 && (
              <AccordionItem value="pitfalls">
                <AccordionTrigger className="text-sm font-medium">常见踩坑</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {pitfalls.map((p) => (
                      <div key={p.issue} className="rounded-xl border border-[color:var(--border)] bg-white/60 p-3">
                        <p className="text-sm font-semibold">{p.issue}</p>
                        <p className="mt-1 text-xs leading-6 text-[color:var(--muted-foreground)]">{p.fix}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {fallbackPlan.length > 0 && (
              <AccordionItem value="fallback">
                <AccordionTrigger className="text-sm font-medium">失败了怎么退</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {fallbackPlan.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-7">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent-color)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {bestFor.length > 0 && (
              <AccordionItem value="bestfor">
                <AccordionTrigger className="text-sm font-medium">最适合的情况</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {bestFor.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-7">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent-color)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="nextstep">
              <AccordionTrigger className="text-sm font-medium">成功后下一步</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-7 text-[color:var(--foreground)]">{recipe.nextStep}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {recipe.sampleInput && (
            <Card>
              <CardHeader className="gap-3">
                <Badge variant="subtle">First Run</Badge>
                <CardTitle className="text-lg leading-7">{recipe.sampleInput.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="rounded-[22px] border border-[color:var(--border)] bg-white/70 p-4 text-xs leading-6 text-[color:var(--foreground)] whitespace-pre-wrap">
                  <code>{recipe.sampleInput.content}</code>
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </Layout>
  );
}
