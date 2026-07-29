// 專題組別簽到表（書面審查）Word 產生器 — 版型比照
// docs/第三次專題書面審查各組簽到表.docx：欄寬比例、標楷體 16pt、列高、組別欄直書、
// 1cm 頁邊界滿版，全部取自該範例。表頭 5 列設 tableHeader，每一頁開頭都會重印
// 校系名稱＋日期時間／地點／參加對象＋欄位標題。成品固定黑字白底（紙本），與畫面主題無關。
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  VerticalMergeType,
  WidthType,
} from 'docx'

const FONT = 'KaiTi' // 標楷體，同範例
const SIZE = 32 // 16pt，範例全文同一級

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: '000000' }
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER }
const MARGINS = { top: 0, bottom: 0, left: 28, right: 28 } // 同範例 tblCellMar

// 滿版：A4 直向 11906 twips 減去上下左右各 567（1cm，同範例）。
// docx@9 的 WidthType.PERCENTAGE 會輸出 w:w="10%"，Word 判定檔案毀損 → 一律用 DXA。
const PAGE_MARGIN = 567
const CONTENT_W = 11906 - PAGE_MARGIN * 2
// 範例欄寬（總和 5000 = 100%）：組別 順序 專題名稱 班級 學號 姓名 簽名
const COLS = [525, 330, 968, 427, 735, 919, 1096].map((p) => Math.round((CONTENT_W * p) / 5000))
COLS[6] += CONTENT_W - COLS.reduce((a, b) => a + b, 0) // 補進位誤差，總寬剛好貼齊版面

const W = (i) => ({ size: COLS[i], type: WidthType.DXA })

// 範例列高（ATLEAST，內容多時自動長高）
const H_META = { value: 618, rule: HeightRule.ATLEAST }
const H_COLHEAD = { value: 719, rule: HeightRule.ATLEAST }
const H_ROW = { value: 680, rule: HeightRule.ATLEAST }

function run(text, opts = {}) {
  return new TextRun({ text: text ?? '', font: { name: FONT, eastAsia: FONT }, size: SIZE, ...opts })
}

const centered = (text, opts) =>
  new Paragraph({ alignment: AlignmentType.CENTER, children: [run(text, opts)] })

function cell(children, opts = {}) {
  return new TableCell({
    borders: BORDERS,
    margins: MARGINS,
    verticalAlign: VerticalAlign.CENTER,
    children,
    ...opts,
  })
}

// vertical-merge helper: 'restart' 顯示文字，'continue' 是被合併掉的空白格
function mergeCell(text, merge, col, opts = {}) {
  if (merge === 'continue') {
    return cell([new Paragraph('')], {
      verticalMerge: VerticalMergeType.CONTINUE,
      width: W(col),
      ...opts,
    })
  }
  return cell([centered(text)], { verticalMerge: VerticalMergeType.RESTART, width: W(col), ...opts })
}

function metaRow(label, value) {
  return new TableRow({
    cantSplit: true,
    tableHeader: true, // 換頁時重印會議資訊
    height: H_META,
    children: [
      cell([centered(label)], { columnSpan: 3 }),
      cell([new Paragraph({ children: [run(value)] })], { columnSpan: 4 }),
    ],
  })
}

// data: { subtitle, datetime, location, audience, groups: [{ order, category, name,
//   members: [{ class_label, student_id, name, isLeader }] }] }
export function buildReviewSigninDoc(data) {
  const rows = []

  // 標題（跨 7 欄）
  rows.push(
    new TableRow({
      cantSplit: true,
      tableHeader: true,
      height: H_META,
      children: [
        cell(
          [
            centered('弘光科技大學　多媒體遊戲發展與應用系', { bold: true }),
            centered(data.subtitle, { bold: true }),
          ],
          { columnSpan: 7 }
        ),
      ],
    })
  )

  rows.push(metaRow('日期時間', data.datetime))
  rows.push(metaRow('地　　點', data.location))
  rows.push(metaRow('參加對象', data.audience))

  // 欄位標題
  rows.push(
    new TableRow({
      cantSplit: true,
      tableHeader: true,
      height: H_COLHEAD,
      children: ['組別', '順序', '專題名稱', '班級', '學號', '姓名', '簽名'].map((t, i) =>
        cell([centered(t, { bold: true })], { width: W(i) })
      ),
    })
  )

  // 學生列：組別／順序／專題名稱 直向合併
  let prevCat = null
  data.groups.forEach((g) => {
    if (!g.members.length) return // 空組別不出列，也不能影響類別合併
    const catRestart = !g.category || g.category !== prevCat
    prevCat = g.category
    g.members.forEach((m, mi) => {
      rows.push(
        new TableRow({
          cantSplit: true,
          height: H_ROW,
          children: [
            // 組別欄直書（同範例）。docx 的 TextDirection 沒有 'tbRlV'（中文直書、字不轉向），
            // 它只有會把字轉 90° 的 'tbRl'，所以直接給 OOXML 值。
            mergeCell(g.category || '', mi === 0 && catRestart ? 'restart' : 'continue', 0, {
              textDirection: 'tbRlV',
            }),
            mergeCell(String(g.order), mi === 0 ? 'restart' : 'continue', 1),
            mergeCell(g.name, mi === 0 ? 'restart' : 'continue', 2),
            cell([centered(m.class_label)], { width: W(3) }),
            cell([centered(m.student_id)], { width: W(4) }),
            cell([centered(m.isLeader ? `${m.name}（組長）` : m.name)], { width: W(5) }),
            cell([new Paragraph('')], { width: W(6) }),
          ],
        })
      )
    })
  })

  const table = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: COLS,
    rows,
  })
  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: PAGE_MARGIN,
              right: PAGE_MARGIN,
              bottom: PAGE_MARGIN,
              left: PAGE_MARGIN,
            },
          },
        },
        children: [table],
      },
    ],
  })
}

export async function downloadReviewSigninDocx(data) {
  const blob = await Packer.toBlob(buildReviewSigninDoc(data))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${data.fileBase}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
