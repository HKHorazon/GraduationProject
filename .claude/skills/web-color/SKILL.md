---
name: web-color
description: 本專案唯一的顏色規範 — 雙主題（Dark Tech 深色預設／Tech Grey 淺色）token 對照表、已量測過對比度的可用色、以及禁止事項。任何要寫或改 frontend/ 顏色、背景、文字色、邊框、badge、狀態色的工作，動手前必讀。
---

# web-color — 顏色規範（BINDING）

**核心規則：顏色不是自由創作。** 只能用下表列出的 class 配對。表上沒有的顏色 = 不准用。
需要一個表上沒有的語意色 → 先加進本檔，再使用。

檔案位置：`frontend/tailwind.config.js`（token）、`frontend/src/assets/main.css`（元件 class）。

---

## 1. Token（唯一色票）

| 角色 | 深色（預設） | 淺色（Tech Grey） |
|---|---|---|
| page bg | `#0f1117` (`dark-bg`) | `#eaeff5` |
| sidebar / 區塊底 | `#161b27` (`dark-sidebar`) | `#f9fbfd` |
| card / 面板 | `#1e2535` (`dark-card`) | `#f9fbfd` |
| raised（input 底） | `#1e2535` | `#ffffff` |
| border | `#2a3347` (`dark-border`) | `#d6dfe9` |
| accent（邊框／focus／底色） | `#00d4ff` (`accent`) | `#00b3d8` |
| accent 實心按鈕 | `#00d4ff` + `#0f1117` 深字 | `#00b3d8` + `#0f1117` 深字（hover `#0099bb`） |

淺色是**灰底帶一點藍**，與深色同色溫；`#ffffff` 只用於 input 底、`.btn-danger` 文字與紙本輸出（Word/Excel）。
畫面上要「白色卡片」→ 用 `.card`，或 `bg-white`（`main.css` 已把它改寫成 `#f9fbfd`）。
**要換淺色配色只改 `main.css` 開頭註解列出的那幾個值**，不要散在各頁改。

---

## 2. 文字色（已量測，全部 ≥ 4.5:1）

深色底（`#1e2535` card）：

| 用途 | class | 對比 |
|---|---|---|
| 主要文字 | `dark:text-slate-100` / `dark:text-slate-200` | 12.4 |
| 次要文字 | `dark:text-slate-300` | 10.3 |
| 弱化／說明 | `dark:text-slate-400` | 5.97 |
| **禁止** | `dark:text-slate-500`(3.2) `slate-600`(2.0) | 不合格 |

淺色底（`#eaeff5` page / `#f9fbfd` surface）：

| 用途 | class | 對比 |
|---|---|---|
| 主要文字 | `text-slate-800` | 12.7 |
| 次要文字 | `text-slate-700` | 9.0 |
| 弱化／說明 | `text-slate-600` | 6.6 |
| **禁止** | `text-slate-500`(4.1) `slate-400`(2.2) | 不合格 |

→ **弱化文字的標準寫法一律是 `text-slate-600 dark:text-slate-400`。**
單寫 `text-slate-500`（現存舊碼中很多）在兩個主題都不合格，看到就順手改掉。

---

## 3. 強調色與狀態色

`#00b3d8` 當**文字**在淺色底只有 2.2、**配白字**只有 2.49 ——
**亮青不能當文字，也不能配白字；當按鈕底色時字一律用深色 `#0f1117`（7.58）。**

淺色的狀態文字一律用 `-700`／`-800` 級（以下皆已量測 ≥ 5:1，page 與 card 底都過）：

| 語意 | 深色 | 淺色 | 淺色對比 |
|---|---|---|---|
| accent 文字／連結 | `dark:text-cyan-400` | `text-cyan-800` | 6.3 |
| accent 實心按鈕 | `.btn-primary`（亮青底深字） | `.btn-primary`（亮青底深字） | 7.6 |
| 危險／錯誤文字 | `dark:text-red-400` | `text-red-700` | 5.6 |
| 危險按鈕 | `.btn-danger`（`red-600` 白字，hover `red-700`） | 同左 | 4.8 |
| 警告／INACTIVE | `dark:text-amber-400` | `text-amber-800` | 6.1 |
| 成功 | `dark:text-emerald-400` | `text-emerald-800` | 6.7 |
| 連結／ID（`.id-mono`） | `#00d4ff` | `#1d4ed8`（`text-blue-700`） | 5.8 |

**淺色禁止當文字**：`cyan-400/600/700`、`red-400/500/600`、`amber-500/600/700`、
`emerald-500/600/700`、`blue-600`（皆 < 4.5）。
深色的狀態色一律 `-400` 級，不要用 `-500` 以下。

---

## 4. Badge

固定三段式：`border` + `bg`（10% tint）+ `text`，圓角 `rounded-full`，`text-[10px] px-2 py-0.5`。

| Badge | 深色 | 淺色 |
|---|---|---|
| 已分組 | `dark:border-cyan-500/40 dark:bg-cyan-400/10 dark:text-cyan-400` | `border-cyan-600/30 bg-cyan-100 text-cyan-800` |
| 未分組 | `dark:border-slate-600 dark:bg-slate-700/30 dark:text-slate-400` | `border-slate-300 bg-slate-100 text-slate-600` |
| 休退學 INACTIVE | `dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-400` | `border-amber-400 bg-amber-100 text-amber-800` |
| 錯誤 | `dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-400` | `border-red-300 bg-red-100 text-red-700` |

badge 文字在有色淡底上的對比也量過：cyan-800/cyan-100 = 6.4、amber-800/amber-100 = 6.4、
red-700/red-100 = 5.3、emerald-800/emerald-100 ≈ 6.5。

---

## 5. 邊框與分隔線

邊框對比只有 1.2–1.4，**永遠不能單靠邊框傳達資訊**（表格列的區隔、選取狀態都要另外給底色或文字變化）。

| 用途 | 寫法 |
|---|---|
| 卡片／面板 | `.card`（已含 border） |
| 表格分隔 | `divide-y divide-slate-200 dark:divide-dark-border` |
| 一般邊框 | `border-slate-200 dark:border-dark-border` |
| 選取／作用中 | 邊框改 accent **並且**加底色：`border-cyan-600 bg-cyan-50 dark:border-accent dark:bg-accent/10` |

---

## 6. 禁止事項（這些是目前畫面走鐘的實際原因）

1. **禁止在 `.vue` 裡寫原始 hex**（`bg-[#0f1520]`、`text-[#00d4ff]`…）。唯一例外是 `main.css` 與 `tailwind.config.js`。要新色 → 加 token。
2. **禁止只寫單一主題的 class。** 任何 `bg-*` / `text-*` / `border-*` 若沒有對應的 `dark:`，就是 bug。唯一例外是 `.card .input .btn-* .label .id-mono` 這些已內建雙主題的元件 class ——**優先用它們**。
3. **禁止再往 `main.css` 加 `html:not(.dark) .xxx { … !important }` 補丁。** 現有的 `.stu-change` 那一段是技術債，不是範本；改到那頁時要把它換成正常的 `dark:` 寫法並刪掉對應 override。
4. 禁止 `bg-white/10` 這種在淺色底幾乎看不見的半透明表面；淺色一律用實心 token。
5. 禁止用顏色當唯一訊號（狀態同時要有文字或 icon）。

---

## 7. 交付前檢查

- [ ] 兩個主題各看過一次（`AppTopbar` 的切換鈕），沒有看不清的文字
- [ ] 弱化文字用 `text-slate-600 dark:text-slate-400`，沒有裸 `text-slate-500`
- [ ] 淺色模式沒有把 accent／red-500／amber-600 當文字
- [ ] diff 裡沒有新的 hex、沒有新的 `!important`
- [ ] 每個 `bg-`/`text-`/`border-` 都有 `dark:` 對子（或用了元件 class）
