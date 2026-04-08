# OpenClaw 内容侦察员三阶段修复提示词

把下面整段直接交给 OpenClaw。

```text
你继续担任 AuraClaw 的“内容侦察员”。

截至 2026-04-08，这一轮修复后的产出方向是对的，但还没有到可稳定投喂后台的程度。
你必须继续修复采集脚本和筛选逻辑。

你要修复的真实问题，来自这次产出文件：
- /Users/joe/Documents/New project/auraclaw/content/inbox/source-harvest/2026-04-08_1717.yaml

这次产出比上一轮好很多：
- 没有 GitHub issue 误收
- 没有 “View Details”
- why_it_matters 和 suggested_angle 已经不再是套话

但仍然有 5 个关键问题，你必须修：

1. 去重太激进
- 现在很多内容被直接判成 “URL 重复”
- 这导致你只扫到来源首页或极少数页面，真正的新内容没有被深入抓出来
- 以后不能只按 URL 字符串做粗暴去重

2. 抓取深度不够
- 你现在主要还是在来源首页附近打转
- 你必须从来源首页继续进入二级、三级内容页
- 目标不是首页，而是正文页、案例页、教程页、文档页、examples 页

3. 语言过滤不够
- 这次收进来的 AMD 英文硬件教程，不符合 AuraClaw 当前的中文用户优先策略
- 除非内容和国内部署、中文用户常见问题高度相关，否则英文硬件/vendor 内容应默认拒绝

4. 编码和清洗不够
- AMD 标题出现了乱码：Ryzenâ\x84¢Â
- 这说明抓取后的文本清洗、编码归一化还不够

5. 重复判断不够“语义化”
- “Master OpenClawin 7 Days” 和我们已有的 openclaw101 学习路径高度重复
- 你不能只看标题不同就认为是新内容
- 必须判断它和现有来源索引、经验包是不是同一类内容

你的真实目标
- 每次只产出少量真正有价值的新候选
- 优先抓“还没进入 AuraClaw”的新正文页
- 减少首页、导航页、重复学习路径、英文泛教程

你必须遵守这套采集顺序

第一层：允许的入口来源
- https://www.openclaw101.club/
- https://openclawcn.cc/
- https://claw101.com/
- https://github.com/mengjian-github/openclaw101
- https://github.com/xianyu110/awesome-openclaw-tutorial
- https://github.com/VoltAgent/awesome-openclaw-skills
- https://openclawskill.ai/

第二层：从入口继续向内抓
- 优先进入 docs/
- 优先进入 guides/
- 优先进入 cases/
- 优先进入 blog/
- 优先进入 examples/
- 优先进入 content/days/
- 优先进入具体教程页，而不是首页

第三层：只有正文页才允许成为候选
- 首页默认不能成为 accepted_candidates
- 导航页默认不能成为 accepted_candidates
- 目录页默认不能成为 accepted_candidates
- 资源站首页默认只能当跳板，不能直接入选

只有下面两种首页/目录页可以被接受：
1. 它本身就是高价值来源地图
2. 它在 AuraClaw 现有内容里还没有同类来源索引

去重规则必须改成 3 层

第一层：已发布内容去重
必须检查这些文件：
- /Users/joe/Documents/New project/auraclaw/src/data.ts
- /Users/joe/Documents/New project/auraclaw/src/source-notes.ts

如果和这些已发布内容高度重复：
- 直接拒绝
- reason 写：与已发布内容重复

第二层：待审核内容去重
必须检查这些目录：
- /Users/joe/Documents/New project/auraclaw/content/inbox/source-harvest/

如果只是 URL 完全重复，但上一条还没审核：
- 不要直接拒绝
- 先判断新抓到的内容是否比旧记录更完整
- 如果更完整，可以保留新版并写明：同源补全版
- 如果没有更完整，再拒绝

第三层：语义重复
即使 URL 不同，如果本质上是同一类学习路径、同一套教程骨架、同一篇内容的镜像：
- 直接拒绝
- reason 写：语义重复

语言过滤规则
- 优先中文内容
- 优先中文用户场景
- 英文内容默认拒绝

英文内容只有同时满足下面条件才能保留：
- 不是泛新闻
- 不是硬件营销
- 不是单纯官方宣传
- 对中文用户有直接执行价值
- 能清楚改写成 AuraClaw 的具体经验包

下面这类英文内容默认拒绝：
- 芯片厂商宣传页
- 硬件性能宣传页
- 非中文用户常见路径的 vendor 教程
- 和“国内部署 / 中文接入 / 中文工作流”关系不大的英文深度文章

编码与正文清洗要求
- 对抓取到的标题和摘要做编码归一化
- 去掉乱码、HTML 实体、控制字符
- 如果标题清洗后仍然不可读，直接拒绝
- 如果正文抓不到，只看到目录、按钮、导航、卡片列表，也直接拒绝

候选内容优先级

最优先收这些：
- 中文平台接入后的第一条工作流
- 中文部署路径选择
- 中文工作流案例
- 可复现的 examples / scripts / config
- 一人公司（OPC）真实工作流
- 抖音 / 行业情报 / GitHub 监控 / 日报周报类题材

降低优先级这些：
- 泛入门介绍
- 已经有很多相似来源的学习路径
- 官方概念页

严格拒绝这些：
- 首页
- 目录页
- 纯营销页
- 英文硬件宣传页
- 单纯“7天学习”镜像页
- 已经在 AuraClaw source-notes 里存在的同类内容

输出规则继续保持
- 每次运行最多 accepted_candidates 3 条
- 允许 0 条
- 宁可空跑，也不要滥收

本轮新增字段要求
对每条 accepted_candidates，除了原有字段外，再增加：
- novelty_reason
- duplicate_check_result
- crawl_depth
- language

字段要求：
- novelty_reason：为什么这条对 AuraClaw 是“新的”
- duplicate_check_result：明确写“已发布重复 / 待审核重复 / 语义重复 / 通过”
- crawl_depth：homepage / secondary / tertiary
- language：zh / en / mixed

本轮特别要求
- 不要再把来源首页当作候选
- 不要再收英文 AMD 这类 vendor 硬件教程
- 不要再把 openclaw101 的 7 天学习路径镜像页当作新候选
- 优先抓更深层的中文正文页

最终保存位置不变
- /Users/joe/Documents/New project/auraclaw/content/inbox/source-harvest/

每次运行结束后，你必须告诉我：
- 保存文件路径
- 接受几条
- 拒绝几条
- 这次最常见的拒绝原因是什么
- 这次是否成功抓到二级或三级正文页
- 最值得优先审核的 1 条是什么

现在请做两件事：
1. 修复脚本
2. 立即重新执行一次，并输出新的 harvest YAML
```
