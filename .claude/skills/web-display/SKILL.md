---
name: web-display
description: 本專案的畫面排版規範 — 頁面骨架、間距尺標、表格／表單／篩選列／彈窗／空狀態的固定寫法、圖示與 RWD。任何要新增或修改 frontend/ 的 view、component、版面配置的工作，動手前必讀。顏色另見 web-color。
---

# web-display — 排版規範（BINDING）

顏色不在這裡，看 **web-color**。這份只管「東西擺哪、多大、多寬」。
參考實作（不確定就抄，不要自創）：
- 清單頁：`frontend/src/views/StudentsView.vue`
- 表單／預覽／執行流程：`frontend/src/views/DocumentsView.vue`
- 彈窗：`frontend/src/views/AccountsView.vue`

---

## 1. 頁面骨架（每一頁都長這樣）

```vue
<template>
  <AppLayout>
    <div class="space-y-4">
      <!-- 標題區 -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">頁面標題</h2>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">共 N 筆</p>
        </div>
        <button v-if="auth.isEditor" class="btn-primary">主要動作</button>
      </div>
      <!-- 篩選列 -->
      <!-- 內容：.card 或表格 -->
    </div>
  </AppLayout>
</template>
```

- 外層永遠是 `<AppLayout>`；`AppLayout` 已給 `p-6` 與捲動，**頁面自己不要再加外距**。
- 最外層固定 `space-y-4`（區塊間距），卡片內部用 `space-y-3`。
- 標題只用 `h2 text-lg font-bold`；副標 `text-xs`。頁面內不出現 `h1`。
- 標題右邊放主要動作按鈕，`btn-primary` 最多一顆。

## 2. 間距尺標（只准用這幾階）

| 用途 | 值 |
|---|---|
| 區塊之間 | `space-y-4` / `gap-4` |
| 卡片內元素 | `space-y-3` / `gap-3` |
| 並排小元件（按鈕、標籤） | `gap-2` |
| 卡片內距 | `p-4`（小卡 `p-3`） |
| 表格儲存格 | `px-4 py-2.5`（緊湊表 `px-3 py-2`） |
| 圓角 | 卡片/輸入 `rounded-xl`、按鈕 `rounded-lg`、badge `rounded-full` |

不要出現 `p-5`、`gap-7`、`mt-[13px]` 這種表外數值。

## 3. 字級

| 用途 | class |
|---|---|
| 頁標題 | `text-lg font-bold` |
| 區塊標題 | `text-sm font-semibold` |
| 內文／表格內容 | `text-sm` |
| 說明、次要資訊 | `text-xs` |
| 表頭、標籤 | `text-[10px] font-mono uppercase tracking-widest` |

中文介面 `font-sans` 即可；`font-display` 只給 logo 與側欄標題；`font-mono` 只給 ID／學號／數字欄。

## 4. 篩選列

固定 `flex gap-2 flex-wrap`，元件一律 `class="input text-xs"` 加固定寬度（`w-32`/`w-36`/`w-48`）：

```vue
<div class="flex gap-2 flex-wrap">
  <input v-model="search" class="input w-48 text-xs" placeholder="搜尋姓名 / 學號…" />
  <select v-model="filterYear" class="input w-36 text-xs">
    <option value="">學年（全部）</option>
  </select>
</div>
```

- 「全部」選項的 value 一律空字串，label 是 `欄位（全部）`。
- 篩選不打 API，就地 `computed` 過濾 `useDataStore` 的資料。
- 篩選結果數量顯示在標題副標。

## 5. 表格

```vue
<div class="card overflow-hidden">
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-slate-200 dark:border-dark-border">
          <th class="px-4 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest
                     text-slate-600 dark:text-slate-400">學號</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200 dark:divide-dark-border">
        <tr class="hover:bg-slate-100/60 dark:hover:bg-dark-border/40">
          <td class="px-4 py-2.5">…</td>
        </tr>
        <tr v-if="!rows.length">
          <td :colspan="cols.length" class="px-4 py-10 text-center text-sm
              text-slate-600 dark:text-slate-400">尚無資料</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

規則：
- 表格一定包在 `.card` + `overflow-x-auto` 裡；不要讓整頁橫向捲動。
- 欄位定義用 `const cols = [{ key, label }]` 陣列驅動 `v-for`，不要手寫七個 `<th>`。
- 可排序欄位：`ChevronsUpDown` 未排序 / `ChevronUp` / `ChevronDown`，`w-3 h-3`，點整個 `<th>`（加 `cursor-pointer`）。
- 每列的操作收在 `TableActionMenu`（`components/TableActionMenu.vue`），不要在列裡塞一排按鈕。
- 空狀態必備；有篩選時文案改「沒有符合的…」，無資料才是「尚無…」。
- 學生／組別名稱一律走 `StudentName` / `GroupName` 元件。

## 6. 表單

- 每個欄位：`<label class="label">標題</label>` + `<input class="input">`，欄位間 `space-y-3`。
- 多欄並排用 `grid grid-cols-2 gap-3`（手機 `grid-cols-1 sm:grid-cols-2`）。
- 錯誤訊息就地顯示在欄位或表單下方，`text-xs text-red-700 dark:text-red-400`；成功訊息同位置用 emerald。
- 送出鈕在表單右下，送出中 `:disabled="busy"` 且文字改「處理中…」。**非同步動作一定要 disable。**
- 必填標記用 `<span class="text-red-700 dark:text-red-400">*</span>`。

## 7. 彈窗（沒有 modal 元件，就地寫）

```vue
<div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
     @click.self="open = false">
  <div class="card w-full max-w-md p-4 space-y-3">…</div>
</div>
```

- 遮罩 `bg-black/50`，`z-50`，點遮罩關閉（`@click.self`）。
- 寬度用 `max-w-md`（表單）／`max-w-2xl`（表格），永遠加 `w-full` 與外層 `p-4`。
- z-index 只有三階：下拉/選單 `z-10`、固定列 `z-20`、彈窗 `z-50`。
- 破壞性動作用原生 `confirm()`，不做二次確認彈窗。

## 8. 載入與空白

- 載入中：`data.loading` 為真時顯示 `text-sm text-slate-600 dark:text-slate-400` 的「載入中…」，不要做 spinner 動畫元件。
- 錯誤：`data.error` 顯示在內容上方一張 `.card`，紅字。
- 資料為空且是「要先去別頁建立」的情況，文案要指路：「尚無老師資料，請先到『資料管理』新增」。

## 9. 圖示與互動

- 只用 `lucide-vue-next`；尺寸只有 `w-3 h-3`（表格內）、`w-4 h-4`（按鈕內）、`w-5 h-5`（側欄）。
- 純圖示按鈕必須有 `title` 或 `aria-label`（中文）。
- 所有可點元素要 `cursor-pointer`；hover 只改顏色／底色，**不要用 `scale` 造成位移**。
- 過場一律 `transition-colors`（150–300ms 預設值即可），不要自訂 `duration-500` 以上。

## 10. RWD

- 側欄在 `lg` 以下收合；主內容 `min-w-0`（已在 `AppLayout`）避免表格撐破版面。
- 篩選列靠 `flex-wrap` 自動換行；卡片格線 `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`。
- 檢查點：375 / 768 / 1280。手機不得出現橫向捲軸（表格自己的 `overflow-x-auto` 除外）。

## 11. 交付前檢查

- [ ] 版面用 `AppLayout` + `space-y-4`，沒有自訂外距
- [ ] 間距／字級都在上面的尺標內
- [ ] 表格有空狀態、有 `overflow-x-auto`、操作收進 `TableActionMenu`
- [ ] 非同步按鈕會 disable 並顯示進行中文字
- [ ] 375px 沒有橫向捲動
- [ ] 顏色照 **web-color** 檢查一遍
