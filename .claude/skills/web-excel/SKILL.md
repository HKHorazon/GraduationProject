---
name: web-excel
description: 本專案 Excel 匯出／匯入／範本的規範（xlsx-js-style）— 檔名、工作表、標題列、樣式、合併、欄寬、解析與驗證、以及必附的自我檢查。任何要產生或讀取 .xlsx/.csv 的工作，動手前必讀。
---

# web-excel — Excel 規範（BINDING）

函式庫只有一個：**`xlsx-js-style`**（CJS，必須 `import XLSX from 'xlsx-js-style'`，用 `import *` 在 Node ESM 下拿不到 `utils`）。
不准加 `xlsx`、`exceljs`、`sheetjs-style` 等替代品。後端不產生 Excel，一律在前端做。

參考實作：`frontend/src/lib/reviewSheet.js`（複雜矩陣版型）、`frontend/src/views/DataView.vue`（單純匯出／匯入）。

---

## 1. 程式碼要放哪

| 情況 | 位置 |
|---|---|
| 單層資料、`json_to_sheet` 就結束 | 可以留在 view 裡（如 `DataView.vue`） |
| 有合併、樣式、雙層表頭、要被匯入解析 | **必須**獨立成 `frontend/src/lib/xxxSheet.js` |

`lib/` 裡的產生器一律寫成**純函式**：領域資料由呼叫端算好後用一個 `ctx` 物件傳進來，函式內不碰 store、不碰 DOM。
view 只負責：組 ctx → 呼叫 `buildXxx()` → 觸發下載。

**每個 `lib/*Sheet.js` 必須附一個自我檢查** `lib/test_xxxSheet.mjs`：`node:assert/strict`、無框架、
內容是 build → 寫成 xlsx → 讀回 → parse，確認資料一模一樣（round-trip）。執行方式寫在檔頭註解，
`cd frontend && node src/lib/test_xxxSheet.mjs`。

## 2. 檔名與工作表

- 匯出：`{中文名稱}_{YYYY-MM-DD}.xlsx` → `` `學生資料_${new Date().toISOString().slice(0, 10)}.xlsx` ``
- 空白範本：`{中文名稱}範本.xlsx`（**不加日期**）
- 帶情境的匯出：`{情境名稱}_{用途}_{日期}.xlsx` → `` `${review.name}_評分_${date}.xlsx` ``
- 工作表名稱用中文短詞：`學生`、`評分`；依學年拆頁時是 `` `${rocYear(y)}學年` ``（民國年，走 `lib/year.js`）。
- 依學年拆分的匯出一律**新到舊**排序。

## 3. 產生（write）

- 欄位標題一律**繁體中文**且與匯入時可接受的鍵一致（`學號`、`姓名`、`班級`、`學年度`、`狀態`、`組別`）。
- 單層資料用 `XLSX.utils.json_to_sheet(rows)`，物件的 key 就是中文標題；空值填 `''`，不要 `null`／`undefined`。
- 版型固定的表用 `XLSX.utils.aoa_to_sheet([...])`，自己控制列順序。
- 一定要設 `ws['!cols']`（欄寬），不然中文全部被截斷。基準：ID/序號 `wch: 8`、姓名/短詞 `wch: 12`、
  名稱/題目 `wch: 30`、老師清單 `wch: 18`。
- 樣式只用兩種，定義成模組層級常數，不要每格現寫：

```js
const HEAD = { font: { bold: true }, fill: { fgColor: { rgb: 'EDEDED' } },
               alignment: { horizontal: 'center', vertical: 'center', wrapText: true } }
const RED  = { fill: { fgColor: { rgb: 'FFC7CE' } }, font: { color: { rgb: '9C0006' }, bold: true },
               alignment: { horizontal: 'center' } }
```

  顏色用 `rgb` 六碼**不含 `#`**。Excel 是紙本／外部檔案，**與畫面主題完全無關**，永遠是白底黑字，
  不要把 web-color 的深色 token 帶進來。
- 雙層表頭：第 1 列是群組名、第 2 列是子欄位，固定欄（第 1 列就有值的）用 `!merges` 直向合併兩列；
  群組欄橫向合併整個區塊。合併寫在 `ws['!merges']`，格式 `{ s: { r, c }, e: { r, c } }`（0-based）。
- 不能填的格子填 `'—'` 並塗 `RED`，不要留白 —— 留白在匯入時無法分辨「不能填」與「忘了填」。
- 下載一律 `XLSX.writeFile(wb, filename)`；不要自己做 Blob/URL。

## 4. 匯入（read）

固定流程，錯一步就會吃到髒資料：

```js
const buf = await file.arrayBuffer()
const wb = XLSX.read(buf, { type: 'array' })
const ws = wb.Sheets[wb.SheetNames[0]]          // 只讀第一張工作表
const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })   // defval 必加
```

- `<input type="file" accept=".xlsx,.xls,.csv">`；讀完後要能 `fileInput.value.value = ''` 重選同一個檔。
- 欄位對應寫一個 `mapKey(header)`，接受中文標題的常見變體（`學號`/`學生學號`）；對不到的欄位直接忽略，不報錯。
- 值一律 `String(v).trim()`；數字欄位自己轉，不要相信 Excel 的型別。
- **驗證在前端先做一輪**：每列產生 `_error` 字串（`缺少學號`、`學號重複`…），畫面用預覽表格逐列顯示，
  只送出 `!_error` 的列。檔案完全沒有資料列 → `檔案沒有資料列`。
- 檔案層級錯誤訊息：`'無法讀取檔案：' + (err.message ?? '格式錯誤')`。
- 前端驗證只是 UX，**後端 `/bulk` 端點必須再驗一次**（見 CLAUDE.md 後端規則 10）。

## 5. 交付前檢查

- [ ] 用 `xlsx-js-style` 的 default import，沒有新增其他函式庫
- [ ] 檔名格式與工作表名稱符合第 2 節
- [ ] `!cols` 有設，中文不會被截斷
- [ ] 樣式常數化、顏色是 6 碼無 `#`、紙本白底黑字
- [ ] 匯入有 `defval: ''`、有逐列 `_error` 預覽、有清空 file input
- [ ] `lib/*Sheet.js` 有對應的 `test_*.mjs` 且 `node src/lib/test_*.mjs` 通過
