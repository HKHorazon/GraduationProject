---
name: project-pending
description: 未完成的開發任務與設計決策
metadata:
  type: project
---

## 下一步待辦（2026-06-05）

**Why:** 用戶中途中斷，要求記住未完成事項。

**How to apply:** 下次繼續工作時從這裡接續。

### 優先任務：全站 Dark Tech 統一

用戶決定「以黑夜模式為主，但務必求個資訊清晰」。需完成：

1. ~~**theme store 預設暗模式**~~ — ✅ 已完成（theme.js 已是 `!== 'light'`，預設 dark；下方「已知 Bug」隨之解除）

2. **StudentsView.vue** — 改成 Dark Tech 風格
   - 表格、filter bar、badge 全部套用 Dark Tech tokens
   - 資訊清晰為優先：高對比度、清楚的 hierarchy

3. **GroupsView.vue** — 改成 Dark Tech 風格
   - 同上

4. **AccountsView.vue** — 改成 Dark Tech 風格

5. **PermissionsView.vue** — 改成 Dark Tech 風格（現有 dark: 類已不錯，微調即可）

6. **DataView.vue** — 改成 Dark Tech 風格

7. **AppLayout.vue / main.css** — 確保 card/input 全局 component 在 dark mode 下有正確 Dark Tech 樣式

### 已知 Bug：學生更動「壞了」

- **根本原因**：dark mode 未預設開啟，RemoveStudentView.vue 用硬編碼黑背景，亮模式下看不到文字
- **修法**：修改 theme store 預設暗模式（任務 #1）即可解決

### 已完成（本 session）

- Dark Tech 設計系統：tailwind.config.js（font-display、dark colors、accent）
- Google Fonts：Space Grotesk、DM Sans、Fira Code、Noto Sans TC
- RemoveStudentView.vue：完整 Dark Tech 改版（搜尋含老師名、雙重確認休退學）
- 學生資料 status 欄位（active/inactive）
- permissions store
- accounts store + AccountsView
- AppTopbar inline login panel
- AppSidebar 用 permissions store 控制顯示
