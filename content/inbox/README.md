# AuraClaw 内容采集投递区

这个目录专门给 OpenClaw 的自动化采集任务使用。

## 固定保存位置

自动化采集结果统一保存到：

`/Users/joe/Documents/New project/auraclaw/content/inbox/source-harvest/`

## 保存规则

- 每次运行生成一个新文件
- 文件名建议使用：
  - `YYYY-MM-DD_HHMM.yaml`
- 不覆盖历史文件
- 不直接修改 `src/data.ts`
- 不直接修改 `src/source-notes.ts`

## 这里保存什么

这里只保存“候选内容”，不是最终上线内容。

每条候选内容应该尽量包含：

- 来源名称
- 原始链接
- 内容类型
- 适合 AuraClaw 的板块
- 一句话摘要
- 为什么适合 AuraClaw
- 更像 `source note` 还是更像 `经验包`
- 如果是经验包，建议改写成什么题目

## 这里不要保存什么

- 不要整篇复制正文
- 不要保存大段原文
- 不要直接当成最终站内内容

AuraClaw 最终要的不是“搬运内容”，而是：

> 已验证、可改写、适合沉淀成经验包或来源索引的内容线索。
