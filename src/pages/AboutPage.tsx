import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { tracks } from "@/data";

export function AboutPage() {
  return (
    <Layout accent="var(--opc)">
      {/* Hero */}
      <section className="pt-16 sm:pt-24">
        <div className="max-w-4xl">
          <p className="eyebrow mb-6">About AuraClaw</p>
          <h1 className="font-serif text-4xl leading-[1.06] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
            不是教程站，也不是 Prompt 市场
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[color:var(--muted-foreground)]">
            AuraClaw 是一台让 OpenClaw 正确经验可以被继承的培养台。把分散在人和网络里的正确做法，整理成普通人也能直接复现的经验包。
          </p>
        </div>
      </section>

      {/* Pull quote */}
      <section className="section-space">
        <div className="border-l-4 border-[color:var(--opc)] pl-8">
          <blockquote className="font-serif text-2xl leading-relaxed tracking-[-0.02em] text-[color:var(--foreground)] sm:text-3xl">
            「经验可以被继承，能力可以被复制，人和 OpenClaw 一起成长。」
          </blockquote>
        </div>
      </section>

      {/* Core values */}
      <section className="section-space">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:items-start">
          <div>
            <p className="eyebrow">核心底色</p>
          </div>
          <div className="space-y-10">
            {[
              {
                title: "经验可以被快速分享",
                body: "别人已经跑通过的正确做法，不应该只停在聊天记录和视频评论区里。它应该被打包、被验证、被复现。",
              },
              {
                title: "能力可以被快速复制",
                body: "真正值钱的不是一句话，而是完整的安装、验证、调试和继续使用的经验。AuraClaw 把这些打包成经验包。",
              },
              {
                title: "人和 OpenClaw 一起成长",
                body: "我们不只希望 OpenClaw 变强，也希望用户慢慢学会更好的对话和判断方式。不是依赖，而是共同进化。",
              },
            ].map((item, i) => (
              <div key={item.title} className="flex gap-8">
                <span className="mt-1 font-serif text-4xl tabular-nums text-[color:var(--border-strong)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-serif text-xl tracking-[-0.02em]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-8 text-[color:var(--muted-foreground)]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 Tracks */}
      <section className="section-space">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:items-start">
          <div>
            <p className="eyebrow">现在的 4 个板块</p>
          </div>
          <div className="divide-y divide-[color:var(--border)] border-t border-[color:var(--border)]">
            {tracks.map((track) => (
              <Link
                key={track.id}
                to={track.path}
                className="flex items-start gap-6 py-6 transition-opacity hover:opacity-60"
              >
                <span
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: track.color }}
                />
                <div className="flex-1">
                  <p className="font-medium text-[color:var(--foreground)]">{track.name}</p>
                  <p className="mt-1 text-sm leading-7 text-[color:var(--muted-foreground)]">{track.summary}</p>
                </div>
                <span className="mt-0.5 text-sm text-[color:var(--muted-foreground)]">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Positioning */}
      <section className="section-space">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:items-start">
          <div>
            <p className="eyebrow">竞品对比</p>
          </div>
          <div className="divide-y divide-[color:var(--border)] border-t border-[color:var(--border)]">
            {[
              { name: "Smithery", desc: "橙+深色，工具目录，对开发者说话。太冷，无情感浓度。" },
              { name: "Raycast", desc: "深色极简，系统感强。太工程师，离普通用户远。" },
              { name: "Mintlify", desc: "蓝绿+白，知识库感。太「文档网站」，没有培养感。" },
              { name: "AuraClaw", desc: "编辑杂志气质，Track 色点缀，成长可见。暖、有机、对普通用户说话。", highlight: true },
            ].map((item) => (
              <div key={item.name} className="flex gap-6 py-5">
                <p
                  className="w-24 shrink-0 text-sm font-semibold"
                  style={{ color: item.highlight ? "var(--opc)" : "var(--foreground)" }}
                >
                  {item.name}
                </p>
                <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
