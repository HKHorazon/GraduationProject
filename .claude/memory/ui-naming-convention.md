---
name: ui-naming-convention
description: 使用者下指令時對各 view 區塊的稱呼慣例（左/右…），照此解讀指令
metadata:
  type: feedback
---

使用者給 UI 修改指令時，會用簡稱指各區塊，需照此對應，避免改錯地方。

**Why:** 指令很短（如「右邊改紅底」），稱呼需與實際 DOM 區塊對齊。

**How to apply:**

### 學生更動頁（`frontend/src/views/changes/RemoveStudentView.vue`）
- **左** = 左側面板：搜尋輸入框 + 其下的搜尋結果清單（同一欄 `w-96`）。
- **右** = 右側操作面板：選取學生後出現的卡片 + 移動/移除/加入/休退學分頁區（`flex-1`）。
  - 注意：搜尋「結果清單」雖在畫面左欄，但使用者口頭可能仍歸在流程裡；以本條為準，「右」固定指右側操作面板。

新區塊／別名出現時，補進本檔。相關 view 命名見 [[project_tech_stack]]。
