---
name: web-docx
description: 本專案 Word 文件產生的規範（docx 套件）— 版面單位 twips/DXA、標楷體、表格與跨頁重印表頭、垂直合併、下載方式與踩過的坑。任何要產生 .docx（簽到表、公文、名冊）的工作，動手前必讀。
---

# web-docx — Word 規範（BINDING）

函式庫只有一個：**`docx`**（v9）。不准加 `docxtemplater`、`officegen`、`html-docx-js`。
後端不產生 Word，一律在前端做。

參考實作：`frontend/src/lib/attendanceYearDoc.js`（簽到表，版型比照 `docs/第三次專題書面審查各組簽到表.docx`）。

---

## 1. 這是紙本，不是網頁

產出的文件**固定黑字白底**，與畫面主題（web-color）完全無關。不要帶入任何深色 token。
版型的依據是**既有的 .docx 範例檔**：欄寬、列高、字級、邊界都從範例量出來後寫成常數，
並在檔頭註解註明來源檔名。沒有範例檔就先問使用者要，不要自己編一個版型。

## 2. 單位與踩過的坑（違反就會產生毀損檔案）

| 規則 | 說明 |
|---|---|
| **一律用 `WidthType.DXA`（twips）** | `WidthType.PERCENTAGE` 在 docx@9 會輸出 `w:w="10%"`，Word 判定檔案毀損 |
| A4 直向寬 = 11906 twips | 內容寬 = `11906 - 頁邊界*2`；1cm = 567 twips |
| 欄寬用比例換算再補誤差 | `COLS = 範例比例.map(p => Math.round(CONTENT_W * p / 總和))`，最後一欄補上 `CONTENT_W - sum` |
| 字級是**半點** | 16pt → `size: 32` |
| 中文字型要指定 eastAsia | `font: { name: 'KaiTi', eastAsia: 'KaiTi' }`（標楷體）；只寫 `name` 中文會掉回預設字型 |
| 列高用 `HeightRule.ATLEAST` | `EXACT` 會把超長內容切掉 |

## 3. 結構寫法

- 所有 `TextRun` 走一個 `run(text, opts)` helper 統一套字型與字級，不要每處重寫。
- 置中段落用 `centered(text)` helper；儲存格用 `cell(children, opts)` helper 統一邊框、內距、垂直置中。
- 邊框常數化：一般 `BorderStyle.SINGLE size 4`，分組粗線 `size 12`。
  **合併儲存格內部畫不出橫線**，要分隔就靠這條粗上框。
- 垂直合併用 `VerticalMergeType.RESTART` / `CONTINUE`，`CONTINUE` 的格子要放一個空 `Paragraph('')`，不能給空陣列。
- 跨頁重印：表頭列（含校系名稱、日期地點等資訊列）加 `tableHeader: true`；不希望被切斷的列加 `cantSplit: true`。
- 頁邊界寫在 section 的 `properties.page.margin`，四邊同值常數。

## 4. 資料介面與下載

- 產生器是**純函式**：`buildXxxDoc(data) → Document`，`data` 由 view 算好（含 `fileBase` 檔名字根），
  函式內不碰 store、不碰 API。
- 下載固定這段，不要換寫法：

```js
export async function downloadXxxDocx(data) {
  const blob = await Packer.toBlob(buildXxxDoc(data))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${data.fileBase}.docx`
  a.click()
  URL.revokeObjectURL(url)   // 必收，否則記憶體洩漏
}
```

- `fileBase` 用中文並含情境：`{學年}學年第{N}次書面審查簽到表`。
- 下載是非同步：view 要有 `downloading` 狀態，按鈕 `:disabled` 且文字改「產生中…」。

## 5. 交付前檢查

- [ ] 只用 `docx`，沒有新增套件
- [ ] 全部 `WidthType.DXA`，沒有 PERCENTAGE
- [ ] 中文字型有 `eastAsia`，字級是半點值
- [ ] 表頭列有 `tableHeader`、資料列有 `cantSplit`
- [ ] `URL.revokeObjectURL` 有呼叫
- [ ] **實際下載打開 Word 檢查過**：不跳毀損、欄寬貼齊、換頁有重印表頭
