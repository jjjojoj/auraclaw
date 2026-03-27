# AuraClaw Design System

> 美学方向：有机进化系统（Organic Growth System）
> 更新时间：2026-03-26
> 状态：当前唯一设计依据

## 核心设计原则

每次做设计决策时，问自己：**这个选择让 AuraClaw 看起来更像「培养台」还是「文档网站」？** 选前者。

AuraClaw 不是冷冰冰的工具，不是百科全书，而是一个**活的培养环境**。设计语言的每一个选择都应该传达：这个东西在生长，你的 OpenClaw 在进化。

气质关键词：**暖、有机、可生长、可验证、不冷冰冰**

---

## 1. 配色系统

### 基础色（CSS 变量，定义在 styles.css :root）

```css
/* 背景系 */
--background:        #f3eee7;
--background-strong: #ebe2d5;
--foreground:        #1a1c1e;
--muted-foreground:  #5d605f;
--panel:             rgba(255, 251, 246, 0.84);
--panel-strong:      rgba(241, 233, 223, 0.86);
--panel-muted:       #efe5d8;
--border:            rgba(41, 43, 45, 0.12);
--ring:              rgba(125, 83, 31, 0.38);
--primary:           #1f2326;
--primary-strong:    #0e1011;
--primary-foreground:#f7f2ea;
--primary-soft:      rgba(125, 83, 31, 0.12);

/* Track 色（四条培养路径的系统信号色） */
--care:      #d66d42;  /* 产后护理 — 橙棕 */
--extension: #1f6b63;  /* 能力扩展 — 深绿 */
--dialogue:  #5070a8;  /* 对话训练 — 蓝紫 */
--opc:       #8d5f2c;  /* 一人公司 — 琥珀 */

/* 状态色（Phase 3 步骤系统） */
--success:       #2d7d5a;
--success-soft:  rgba(45, 125, 90, 0.10);
--progress:      #c4873a;
--progress-soft: rgba(196, 135, 58, 0.12);

/* 步骤系统色 */
--step-active:  #1a1c1e;
--step-done:    #2d7d5a;
--step-pending: #9a9c9b;
```

### Track 色使用规范

Track 色不只是装饰色，是**系统信号色**：
- RecipeCard 顶部 3px 细线：表示归属
- Layout accent prop：当前页面的环境色
- 步骤完成状态：用 `--success`，不用 Track 色
- Badge variant="accent"：用当前页面 accent color

---

## 2. 字体系统

```css
--font-sans: "Manrope", "Avenir Next", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
--font-serif: "Iowan Old Style", "Baskerville", "Songti SC", "STSong", "Noto Serif SC", serif;
```

### 使用规范

| 用途 | 字体 | 尺寸 | 字重 | 行高 | 字间距 |
|------|------|------|------|------|--------|
| Hero H1 | serif | 5xl–7xl | normal | 1.04 | -0.05em |
| Page H1 | serif | 4xl–5xl | normal | tight | -0.04em |
| Section H2 | serif | 2xl–3xl | normal | snug | -0.03em |
| 主要段落 | sans | base | normal | 8 | 默认 |
| 卡片内容 | sans | sm | normal | 7 | 默认 |
| 标签/元信息 | sans | xs | medium | 6 | 默认 |
| 步骤编号 | sans | sm | semibold | — | tabular-nums |

---

## 3. 布局规范

### 页面容器
```
.page-shell: max-w-7xl, mx-auto, px-4/6/8, pt-5, pb-16
.section-space: mt-16 sm:mt-24
```

### 任务流布局（RecipePage 专用，桌面端）
```
左栏（执行主线）: flex-[1.2]，bg-[--panel]，border，rounded-2xl，p-6
右栏（参考信息）: flex-[0.8]，无背景
栏间距: gap-8
```

### 卡片规范
- 标准卡片：`rounded-2xl border border-[--border] bg-[--panel]`
- Track 归属卡片：顶部加 `border-t-[3px] border-t-[color:var(--accent-color)]`
- 悬停：`hover:-translate-y-0.5 transition-transform duration-150`

---

## 4. 步骤组件规范

### 三种状态

**进行中（active）**
```
border border-[--foreground]
bg-[--panel]
left: 4px 色条，颜色为当前 Track accent
text: --step-active
编号圆圈: bg-[--foreground] text-white
```

**已完成（done）**
```
border border-[--success]
bg-[--success-soft]
text: --step-done（降权）
编号圆圈: bg-[--success] text-white，显示 ✓
```

**未开始（pending）**
```
border border-[--border]
bg-transparent
text: --step-pending（灰色）
编号圆圈: border border-[--border] text-[--step-pending]
```

### 进度指示器（RecipePage 顶部）
```
4 步线性：准备 ── 执行 ── 验证 ── 完成
当前步骤: Track accent 色 + font-semibold
已完成步骤: --success 色
未开始步骤: --step-pending 色
连接线: 1px --border，已完成段变为 --success
```

---

## 5. 动效规范

**原则：最小化、有意义，不做装饰性动效。**

| 场景 | 属性 | 时长 | 缓动 |
|------|------|------|------|
| 卡片悬停 | translateY(-2px) | 150ms | ease-out |
| 步骤展开 | height | 200ms | ease-out |
| 步骤完成 | border-color → success | 300ms | ease-out |
| 进度条填充 | width | 400ms | ease-out |
| 页面过渡 | opacity | 150ms | ease-in-out |

不使用：bounce、spin（非 loading 场景）、循环动画、parallax。

---

## 6. 「已跑通」状态规范

**RecipeCard 右上角徽章**
```
条件: localStorage auraclaw_progress[recipeId].completed === true
样式: bg-[--success-soft] text-[--success] text-xs px-2 py-0.5 rounded-full
内容: ✓ 已跑通
位置: absolute top-3 right-3
```

**RecipePage 完成按钮**
```
条件: 所有 validationSteps 已勾选
样式: bg-[--success] text-white（替换原有 primary 样式）
内容: 标记为已跑通 ✓
点击后: 按钮变为「已跑通 · {日期}」，不可再点击
```

---

## 7. 竞品对比定位

| 产品 | 气质 | AuraClaw 差异化 |
|------|------|----------------|
| Smithery | 橙+灰，工具目录，开发者向 | 太冷，无情感浓度 |
| Raycast | 深色极简，系统感强 | 太工程师，离普通用户远 |
| Mintlify | 蓝绿+白，知识库感 | 太「文档网站」，没有培养感 |

**AuraClaw 的稀缺位置：暖色系 + 有机感 + 进度/成长可见。**
不要往深色走，不要往科技蓝走，这是核心差异化资产。

---

## 8. QA 检查清单

每次 `/design-review` 时检查：
- [ ] 新组件是否使用了 CSS 变量而非硬编码颜色
- [ ] Track 色是否只通过 `--accent-color` 传入，而非直接写死
- [ ] 步骤状态三种都有正确的视觉区分
- [ ] 「已跑通」状态在 RecipeCard 和 RecipePage 都正确显示
- [ ] 动效是否符合「最小化有意义」原则
- [ ] 字体是否按规范分配（serif 标题，sans 正文）
- [ ] 暖米色背景是否保持，没有引入白色或深色底色
