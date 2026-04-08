# OpenClaw 内容侦察员 v5 稳定性修复提示词

把下面整段直接交给 OpenClaw。

```text
你现在不是继续扩功能，而是专门修复 AuraClaw 内容侦察员的“筛选韧性”。

当前实际运行脚本路径：
/Users/joe/.openclaw/workspace/scripts/auraclaw-scout.py

当前项目根目录：
/Users/joe/Documents/New project/auraclaw

这次修复的唯一主题：
- 提高筛选阶段的稳定性
- 避免抓到了很多内容，但因为 GLM 超时而整轮变成 0 条 accepted

重要要求：
- 这轮修复指定使用 GLM-5.1 作为主模型
- 不是 GLM-4.7
- 不是默认模型
- 请明确把脚本里的主模型改成 GLM-5.1

当前已知真实问题

截至 2026-04-08，最新一次运行结果是：
/Users/joe/Documents/New project/auraclaw/content/inbox/source-harvest/2026-04-08_1847.yaml

这轮说明：
- 抓取已经成功
- 站外发现已经成功
- 深层页面抓取已经成功
- 去重已经成功

但最终失败在筛选阶段：
- content_pages_count: 86
- unique_candidates_count: 84
- accepted_candidates_count: 0
- notes: GLM API 失败

这说明系统现在的主要瓶颈不是抓取，而是：
- GLM 调用超时
- 一旦超时，整轮没有 accepted_candidates
- 当前失败兜底还不够强

你的修复目标

把 AuraClaw 内容侦察员从：
- “抓取得很好，但 GLM 一超时就白跑”

升级成：
- “即使 GLM 偶发超时，也能尽量产出稳定候选”

你必须修复下面 8 件事

1. 主模型改成 GLM-5.1

要求：
- 将脚本里的主模型显式改成 GLM-5.1
- 不要继续以 GLM-4.7 作为主模型
- 所有主筛选逻辑先走 GLM-5.1

建议变量：
- GLM_MODEL_PRIMARY = "glm-5.1"

如果你需要保留兼容结构，可以额外定义：
- GLM_MODEL_FALLBACK = "glm-4.7"

但主模型必须是 GLM-5.1。

2. 增加 GLM 重试机制

当前问题：
- 只要一次超时，就整轮失败

你要加：
- 最少 3 次重试
- 指数退避
- 每次失败后打印简洁日志

建议策略：
- 第 1 次：正常调用
- 第 2 次：缩短 prompt 内容再调用
- 第 3 次：减少候选数量再调用

如果 3 次都失败，再进入 fallback 策略。

3. 增加 prompt 降载机制

当前 unique_candidates 很多时，prompt 太长容易拖慢模型。

你要改成分层处理：

第一步：
- 内部评分排序
- 先只把 top 12 发给 GLM-5.1

如果超时：
- 自动缩成 top 8 再试

如果再超时：
- 自动缩成 top 5 再试

不要一次把太多候选全丢给模型。

4. 增加 fallback 策略

要求：
- 主筛选先用 GLM-5.1
- 如果 GLM-5.1 三次都失败，再进入 fallback

fallback 可以是以下任一方式，但你必须实现其中至少一种：

方案 A：
- 用 GLM-4.7 做二级 fallback

方案 B：
- 不调用第二个模型，直接按内部质量评分输出一个人工待审快照

注意：
- fallback 不能自动发布
- fallback 只能帮助保留候选，不是替代人工审核

5. GLM 失败时必须保留候选快照

这是本轮最重要的修复之一。

当前一旦 GLM 失败，最终 YAML 几乎只剩：
- 重复项
- 0 条 accepted

这不够好。

你必须在 GLM 完全失败时，额外写出：
- glm_status
- glm_failure_reason
- fallback_mode
- prefiltered_candidates

其中：
- prefiltered_candidates 最少保留 top 10
- 每条必须包含：
  - title
  - source_name
  - source_url
  - canonical_url
  - board_fit_guess
  - quality_scores
  - novelty_reason
  - crawl_depth
  - language

这样即使模型超时，人类也能在后台看到“这一轮最值得人工看”的候选。

6. 增加筛选结果状态字段

在最终 YAML 里增加：
- glm_status: success / retry_success / fallback / failed
- glm_model_used
- glm_attempts
- fallback_mode

如果成功：
- 说明用了哪次重试成功

如果失败：
- 明确失败原因
- 明确 fallback 是否生效

7. 增加“人工可接管”模式

如果 GLM 失败，但内部评分已经足够高：
- 不要把 accepted_candidates 自动设为非空
- 但要把 prefiltered_candidates 按质量排序保留

也就是说：
- 模型失败时仍然保持 accepted_candidates = []
- 但不能让这轮成果完全丢失

这一步的目标是：
- 后台可以人工接管
- 而不是整轮作废

8. 增加运行摘要中的稳定性指标

请在最终 YAML 和终端摘要里增加：
- glm_latency_seconds
- glm_timeout_count
- retry_count
- fallback_triggered
- prefiltered_candidates_count

让后续我们能看出：
- 到底是内容问题
- 还是模型超时问题
- 还是 prompt 太长问题

实现要求

你必须直接修改：
/Users/joe/.openclaw/workspace/scripts/auraclaw-scout.py

然后：
1. 检查语法
2. 立即运行一次
3. 生成新的 harvest YAML 到：
   /Users/joe/Documents/New project/auraclaw/content/inbox/source-harvest/
4. 检查输出质量

输出质量判断标准

这轮不要求一定有 accepted_candidates。
这轮最重要的是：
- 即使 GLM 失败，也必须保留高质量 prefiltered_candidates
- 必须能明确看到是哪个阶段失败
- 必须能看出重试和 fallback 是否生效

这轮完成后，你最后必须告诉我：
- 本次保存文件路径
- GLM 是否成功
- 主模型是否已改成 GLM-5.1
- 一共尝试了几次
- 有没有触发 fallback
- 有没有写出 prefiltered_candidates
- 本轮最值得优先人工审核的 3 条是什么
- 你具体改了哪些逻辑

额外限制

- 不要另写新脚本
- 不要只改提示词
- 必须改当前实际运行脚本
- 不要把真实 API key 写回脚本
- 如果缺少环境变量，请明确报错
- 不要跳过实际运行验证
```
