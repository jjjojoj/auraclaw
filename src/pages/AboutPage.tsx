import { Layout } from "@/components/Layout";
import { SectionHeading } from "@/components/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AboutPage() {
  return (
    <Layout accent="var(--opc)">
      <section className="space-y-5">
        <Badge variant="accent">About AuraClaw</Badge>
        <div className="space-y-4">
          <h1 className="max-w-4xl font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">
            不是教程站，也不是 Prompt 市场，而是 OpenClaw 经验可以被继承的地方
          </h1>
          <p className="max-w-3xl text-base leading-8 text-[color:var(--muted-foreground)]">
            AuraClaw 想做的，是把分散在人和网络里的 OpenClaw 正确经验，整理成普通人也能直接复现的经验包。
          </p>
        </div>
      </section>

      <section className="section-space">
        <SectionHeading eyebrow="Core" title="AuraClaw 的核心底色" />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "经验可以被快速分享",
              body: "别人已经跑通过的正确做法，不应该只停在聊天记录和视频评论区里。",
            },
            {
              title: "能力可以被快速复制",
              body: "真正值钱的不是一句话，而是完整的安装、验证、调试和继续使用的经验。",
            },
            {
              title: "人和 OpenClaw 一起成长",
              body: "我们不只希望 OpenClaw 变强，也希望用户慢慢学会更好的对话和判断方式。",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle className="text-xl leading-8">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-space">
        <SectionHeading eyebrow="Structure" title="现在的 4 个板块" />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {[
            ["产后护理", "先把第一件事做成。"],
            ["能力扩展", "把需要的能力一起装上。"],
            ["对话训练", "把模糊表达收成可执行结构。"],
            ["一人公司（OPC）", "把单点能力接成工作骨架。"],
          ].map(([title, body]) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle className="text-xl leading-8">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </Layout>
  );
}
