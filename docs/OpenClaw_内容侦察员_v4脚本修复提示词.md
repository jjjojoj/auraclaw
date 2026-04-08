# OpenClaw 内容侦察员 v4 脚本修复提示词

把下面整段直接交给 OpenClaw。

```text
你现在不是继续跑 AuraClaw 内容侦察员，而是要修复它当前运行中的 v3 脚本。

当前实际运行脚本路径是：
/Users/joe/.openclaw/workspace/scripts/auraclaw-scout.py

当前服务项目根目录是：
/Users/joe/Documents/New project/auraclaw

当前产出已经达到“可进入后台审核”的水平，但还没有达到“尽量接近完美”的水平。
你要做的是：直接修脚本、跑通、生成一轮新结果，并汇报修复效果。

先看当前脚本，再修，不要另起炉灶。

你必须重点修复下面这些真实问题：

1. 接受上限没有收紧
当前脚本 prompt 里仍然写着：
- 最多接受 5 条
但 AuraClaw 现在希望：
- 每次最多 accepted_candidates 3 条
- 宁可 0 条，也不要滥收

请修复：
- prompt 文案
- 结果后处理逻辑
- 最终 YAML 输出
确保 accepted_candidates 永远不会超过 3 条

2. 当前来源仍然被写死在 ALLOWED_SOURCES
AuraClaw 不应该永远只抓我们手动给的那几个站。
但也不能完全放飞，必须“受控扩张”。

你要把来源机制升级成两层：

第一层：核心种子来源
- 保留现有 ALLOWED_SOURCES，作为高信任种子

第二层：发现型来源
- 从高信任正文页中提取外链
- 只保留与 OpenClaw / agent / workflow / skill / 中文教程 强相关的外链
- 新发现的来源不要直接永久加入主列表
- 只把它们作为 discovered_sources 候选，进入本次运行的附加扫描

发现型来源规则：
- 必须有明确正文内容
- 必须不是广告页
- 必须不是纯导航站
- 必须不是无关 AI 新闻
- 优先 GitHub 仓库、文档站、教程站、案例站
- 新发现来源每次最多扩展 5 个

输出时要增加：
- discovered_sources_count
- discovered_sources_sample

3. URL 去重仍然不够稳
当前去重主要靠原始 URL 和标题，仍然容易受到：
- 尾部斜杠
- query 参数
- utm 参数
- 大小写差异
- GitHub blob/raw/html URL 差异
影响。

你要增加 canonical URL 规范化函数：
- 去掉 fragment
- 去掉常见追踪参数，如 utm_*、ref、source
- 统一尾部斜杠
- GitHub 同一文件的 blob/raw/html_url 尽量归一
- 保留真正影响内容的 path

之后去重都先基于 canonical_url 再判断。

accepted_candidates 和 rejected_candidates 中都要新增：
- canonical_url

4. 当前“3层抓取”其实还不够真
网站抓取现在主要是：
- 首页
- 二级链接
还没有真正对高价值路径做递归深入。

你要把网站抓取升级成：
- homepage
- secondary
- tertiary

规则：
- 先抓首页
- 从首页进入优先路径
- 对优先路径里的二级正文页，再继续深入一次
- tertiary 只抓高价值路径，不要无限递归
- 每个站点最多抓 20 个页面

尤其优先这些路径：
- /docs/
- /guides/
- /cases/
- /blog/
- /examples/
- /advanced/
- /config/
- /content/days/

输出中要准确区分：
- crawl_depth: homepage / secondary / tertiary

5. GitHub 抓取还不够深
当前 GitHub 逻辑只扫顶层 docs/examples/content 等目录的 md 文件，不够。

请升级：
- 支持递归一层子目录
- 优先 README、docs、examples、scripts、content/days、guides
- 对文件标题不要直接用文件名原样输出
- 尝试从 markdown 第一行 `# 标题` 提取更自然的标题

像这种标题要修掉：
- api-key-config-guide.md - xianyu110/awesome-openclaw-tutorial

应该变成更自然的人类标题，例如：
- API Key 配置指南

6. source_name 需要更像正式来源名
当前 source_name 还是 source_id 风格，比如：
- github-awesome-openclaw-tutorial

请增加来源显示名映射，例如：
- GitHub / awesome-openclaw-tutorial
- OpenClaw101.club
- OpenClaw 中文社区

不要把内部 source_id 直接当成最终展示名。

7. content_type 不要全部硬编码成 tutorial
当前 accepted 输出里 content_type 几乎都被写死。

请根据内容真实类型尽量区分：
- tutorial
- guide
- source_map
- example
- workflow
- config
- deep_dive

8. needs_manual_review 逻辑不对
进入 AuraClaw 后台的内容，本质上都需要人工审核。
所以：
- accepted_candidates 里的 needs_manual_review 默认应为 true
- 只有极少数已经高度标准化的来源索引，才允许 false

9. 安全问题：不要把 GLM API Key 硬编码在脚本里
当前脚本里直接写着 API Key。

请改成：
- 优先读取环境变量
- 如果缺失，再明确报错
- 不要把真实 key 再写回脚本

建议变量名：
- AURACLAW_GLM_API_KEY

如果你需要兼容旧环境，也可以：
- 优先读环境变量
- 再读本地 `.env`

10. 语义去重还可以更强
当前只是把已有 summaries 前 20 条给 GLM，不够。

请优化：
- 优先传入最相关的已发布标题，而不是固定前 20 条
- 先做关键词召回，再把相关已发布条目交给 GLM 判断
- 同时把最近几轮 pending 的候选标题也一起传入，避免重复投递

11. 增加质量评分
请给每条候选增加内部评分，不一定写进最终 YAML，但至少用于排序：
- relevance_score
- novelty_score
- execution_value_score
- china_fit_score

最终优先保留：
- 中文适配高
- 执行价值高
- 新颖性高
- 与 AuraClaw 四板块强相关

12. 增加站外发现能力，但保持可控
不要只抓我们列出的网站。
你要增加一种“从正文里发现新来源”的模式，但只能受控进行。

优先发现这些来源类型：
- GitHub 仓库
- 独立文档站
- 中文教程站
- 飞书知识库
- 可公开访问的案例页

严格拒绝纳入发现池的：
- 纯资讯媒体
- 纯导航聚合站
- 营销 landing page
- 社群招募页
- 无法稳定访问的随机页面

最终产出要求

1. 先修改脚本：
/Users/joe/.openclaw/workspace/scripts/auraclaw-scout.py

2. 再立即运行一次

3. 生成新的 harvest YAML 到：
/Users/joe/Documents/New project/auraclaw/content/inbox/source-harvest/

4. 最后告诉我：
- 本次保存文件路径
- 接受几条
- 拒绝几条
- 是否成功限制到最多 3 条 accepted_candidates
- 是否新增了 discovered_sources
- 最值得优先审核的 3 条是什么
- 你具体改了哪些逻辑

额外要求
- 不要另建一个新脚本，直接修当前 v3
- 不要只改 prompt，必须改脚本逻辑
- 跑完后检查语法
- 跑完后检查输出质量
- 如果输出质量还不够，就继续修到明显优于 2026-04-08_1751.yaml
```
