# AuraClaw 审核层

这个目录用于保存人工审核状态和审核历史。

## 使用方式

- 管理后台登录页：`/admin/login`
- 管理后台审核页：`/admin/review`
- 普通前台不会展示审核入口
- 只有管理员登录后，才可以查看和修改这些审核状态

## 设计原则

- 原始采集文件永远保留在 `content/inbox/source-harvest/`
- 审核状态单独保存，不覆盖采集结果
- 所有审核动作都保留历史，支持回溯
- 原始采集结果和审核结果分离，避免误删和误覆盖

## 文件说明

- `state.json`
  当前每条候选内容的最新审核状态

- `history.jsonl`
  审核动作历史日志，一行一条记录

## 审核状态

- `pending`
- `approved_source_note`
- `approved_recipe`
- `rejected`
- `archived`
