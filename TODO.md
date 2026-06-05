# 待辦事項

## 🔥 優先：全站 Dark Tech 統一

用戶決定「以黑夜模式為主，資訊清晰為優先」。

### 1. 預設暗模式（修復「學生更動壞了」）
- **檔案**：`src/stores/theme.js`
- **改法**：把 `localStorage.getItem('theme') === 'dark'` 改成 `localStorage.getItem('theme') !== 'light'`
- **原因**：RemoveStudentView 用硬編碼黑背景，亮模式下文字不可見

### 2. StudentsView Dark Tech 改版
- **檔案**：`src/views/StudentsView.vue`
- filter bar、table 套用 Dark Tech tokens
- 移除 `dark:` 前綴，改用直接黑底色

### 3. GroupsView Dark Tech 改版
- **檔案**：`src/views/GroupsView.vue`
- 同上

### 4. AccountsView Dark Tech 改版
- **檔案**：`src/views/AccountsView.vue`

### 5. PermissionsView 微調
- **檔案**：`src/views/PermissionsView.vue`
- 現有 dark: 類已不錯，統一風格即可

### 6. DataView Dark Tech 改版
- **檔案**：`src/views/DataView.vue`

### 7. AppLayout / main.css 全局組件
- `src/assets/main.css`：card、input 在暗模式下套用 Dark Tech tokens
- `src/components/layout/AppLayout.vue`：main 加 `min-h-0` 防 flex overflow 問題

---

## Dark Tech Design Tokens（參考）

```
背景：  #0f1117（頁面）  #161b27（sidebar/section）  #1e2535（card）
邊框：  #2a3347
強調色：#00d4ff (cyan)
字體：  font-display = Space Grotesk | font-sans = DM Sans | font-mono = Fira Code
```

表格 header：`text-[10px] font-mono uppercase tracking-widest text-slate-500`  
Badge 已分組：`border-cyan-500/40 bg-cyan-400/10 text-cyan-400`  
Badge 未分組：`border-slate-700 bg-dark-border/50 text-slate-500`  
Badge INACTIVE：`border-amber-700/50 bg-amber-900/20 text-amber-500`
