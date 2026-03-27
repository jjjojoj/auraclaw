# AuraClaw Design System

> 美学方向：编辑杂志系统（Editorial Magazine System）
> 更新时间：2026-03-27
> 状态：当前唯一设计依据
> 历史版本：v1（有机进化系）见文末对比

## 核心设计原则

每次做设计决策时，问自己：**这个选择让 AuraClaw 看起来更像「精装手册」还是「工具目录」？** 选前者。

AuraClaw 是记录 AI 助手成长的精装手册，不是冷冰冰的工具目录。设计语言的每个选择都应该传达：这是一个有品位的、认真对待用户时间的平台。

气质关键词：**编辑、精准、高对比、有序、稀缺点色**

---

## 1. 配色系统

### 基础色（CSS 变量，定义在 styles.css :root）

```css
/* 表面色 */
--background:        #fafaf9;  /* 接近纯白，不刺眼 */
--background-strong: #f4f4f2;
--foreground:        #0f0f0e;  /* 近黑，高对比 */
--muted-foreground:  #6b6b68;
--panel:             #ffffff;
--panel-strong:      #f7f7f6;
--panel-muted:       #f4f4f2;

/* 结构色 */
--border:            rgba(15, 15, 14, 0.10);
--border-strong:     rgba(15, 15, 14, 0.18);
--ring:              rgba(15, 15, 14, 0.30);

/* 主操作色 */
--primary:           #0f0f0e;
--primary-strong:    #000000;
--primary-foreground:#fafaf9;
--primary-soft:      rgba(15, 15, 14, 0.06);

/* Track 色（四条培养路径的系统信号色，保持不变） */
--care:      #d66d42;  /* 产后护理 — 橙棕 */
--extension: #1f6b63;  /* 能力扩展 — 深绿 */
--dialogue:  #5070a8;  /* 对话训练 — 蓝紫 */
--opc:       #8d5f2c;  /* 一人公司 — 琥珀 */

/* 状态色 */
--success:       #1a6641;
--success-soft:  rgba(26, 102, 65, 0.08);
--progress:      #b87333;
--progress-soft: rgba(184, 115, 51, 0.10);

/* 步骤系统色 */
--step-active:  #0f0f0e;
--step-done:    #1a6641;
--step-pending: #c4c4c1;
```

### Track 色使用规范

Track 色是**系统信号色**，不是装饰色：
- RecipeCard 顶部 3px 细线：表示归属
- TrackPage / RecipePage 左侧 accent 竖线：环境感
- 步骤圆点小色块：当前 Track 的标识
- 不用于大面积填充背景

---

## 2. 字体系统

```css
--font-sans: "DM Sans", system-ui, -apple-system, sans-serif;
--font-serif: "Fraunces", "Georgia", serif;
```

字体通过 Google Fonts 加载（在 index.html 中）：
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
```

### 使用规范

| 用途 | 字体 | 尺寸 | 字重 | 字间距 |
|------|------|------|------|--------|
| Hero H1 | Fraunces serif | 5xl–8xl | 400 | -0.03em |
| Page H1 | Fraunces serif | 4xl–6xl | 400 | -0.03em |
| Section H2 | Fraunces serif | 3xl–4xl | 400 | -0.02em |
| Card title | Fraunces serif | xl–2xl | 400 | -0.02em |
| Pull quote | Fraunces serif | 2xl–3xl | 400 italic | -0.02em |
| Body | DM Sans | sm–base | 400 | 0 |
| UI labels | DM Sans | xs–sm | 500–600 | 0 |
| Eyebrow | DM Sans | 11px | 500 | 0.22em |
| Code | monospace | xs–sm | 400 | 0 |

---

## 3. 形状系统

| 元素 | 圆角 |
|------|------|
| Card | rounded-xl (12px) |
| Button (default/outline) | rounded-md (6px) |
| Badge | rounded-sm (4px) |
| Input | rounded-md (6px) |
| Code surface | rounded-md (6px) |
| Full pill | rounded-full — 仅用于状态指示圆点 |

---

## 4. 间距系统

- Base unit: 4px
- Section gap: `section-space` = `mt-20 sm:mt-28`
- Page shell: `pt-0`（导航直接在顶部，Hero 内部有 `pt-16 sm:pt-24`）
- Card padding: `p-6`（header）/ `px-6 pb-6`（content）

---

## 5. 导航规范

全宽顶部导航，黑色底部 1px 线。

```
结构：logo左 | nav中 | CTA右
背景：var(--background) 白色，无 blur
底线：border-b border-[color:var(--border-strong)]
active 状态：font-semibold text-foreground（加粗，无色线）
```

---

## 6. 卡片与表面规范

```
Card: rounded-xl border border-[--border] bg-[--panel] shadow-[0_2px_12px_0_rgba(15,15,14,0.06)]
代替旧版: rounded-[28px] backdrop-blur-sm 大投影
```

编辑风格常用「gap-px + 背景色」代替卡片网格：
```html
<div class="grid gap-px bg-[color:var(--border)] lg:grid-cols-3">
  <RecipeCard />  <!-- bg-white 的卡片，间隔线由父级 gap-px 产生 -->
</div>
```

---

## 7. 动效规范

- 持续时间：micro 50ms / short 100-150ms / medium 200ms
- Easing：enter ease-out / exit ease-in
- 允许：opacity hover、color transition、border transition
- 禁止：translate 动画、旋转、循环动画、parallax

---

## 8. 「已跑通」状态规范

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
样式: style={{ background: "var(--success)", color: "#fff" }}
内容: 标记为已跑通 ✓
点击后: 显示「✓ 已跑通 · {日期}」文字
```

---

## 9. QA 检查清单

每次 `/design-review` 时检查：
- [ ] 新组件是否使用了 CSS 变量而非硬编码颜色
- [ ] Track 色是否只通过 `--accent-color` 传入，而非直接写死
- [ ] 步骤状态三种都有正确的视觉区分
- [ ] 「已跑通」状态在 RecipeCard 和 RecipePage 都正确显示
- [ ] 背景是否保持 `#fafaf9`，没有引入暖米色或深色底色
- [ ] 字体是否按规范分配（Fraunces 标题，DM Sans 正文）
- [ ] 圆角是否收敛（无 rounded-[28px] 或 rounded-2xl 以上）
- [ ] 导航是否为全宽顶部，无 glassmorphism

---

## 历史对比：v1 有机进化系（2026-03-26）

| 维度 | v1 有机进化系 | v2 编辑杂志系（当前） |
|------|------------|--------------------|
| 背景 | 暖米色 #f3eee7 | 近白 #fafaf9 |
| 字体 | Iowan Old Style + Manrope | Fraunces + DM Sans |
| 卡片 | rounded-[28px] + backdrop-blur | rounded-xl 轻投影 |
| 导航 | 浮动 pill + glassmorphism | 全宽顶部细线 |
| 按钮 | rounded-full pill | rounded-md 方形 |
| 气质 | 暖、有机、培养感 | 编辑、精准、高对比 |
