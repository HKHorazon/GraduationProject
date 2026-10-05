// 專題組別簽到表（書面審查）Word 產生器 — 版型比照
// docs/第三次專題書面審查各組簽到表.docx：欄寬比例、標楷體 16pt、列高、組別欄直書、
// 1cm 頁邊界滿版，全部取自該範例。表頭 5 列設 tableHeader，每一頁開頭都會重印
// 校系名稱＋日期時間／地點／參加對象＋欄位標題。成品固定黑字白底（紙本），與畫面主題無關。
// 組長簽到版（buildLeaderSigninDoc）沒有範例檔，沿用同一套表頭與標楷體，一組一列只留組長；
// 為了把一屆（約 20 組）壓在一頁內，資料列改 14pt、列高約 1cm（仍夠簽名）。
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  LineRuleType,
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
// 組與組的交界線（同範例 w:sz="12"）。合併儲存格內部畫不出橫線，所以用這條粗線分組。
const THICK = { style: BorderStyle.SINGLE, size: 12, color: '000000' }
const TOP_THICK = { borders: { ...BORDERS, top: THICK } }
const MARGINS = { top: 0, bottom: 0, left: 28, right: 28 } // 同範例 tblCellMar

// 滿版：A4 直向 11906 twips 減去上下左右各 567（1cm，同範例）。
// docx@9 的 WidthType.PERCENTAGE 會輸出 w:w="10%"，Word 判定檔案毀損 → 一律用 DXA。
const PAGE_MARGIN = 567
const CONTENT_W = 11906 - PAGE_MARGIN * 2
// 欄寬比例（總和 5000 = 100%）換成 twips，最後一欄補進位誤差，總寬剛好貼齊版面
function colWidths(ratios) {
  const cols = ratios.map((p) => Math.round((CONTENT_W * p) / 5000))
  cols[cols.length - 1] += CONTENT_W - cols.reduce((a, b) => a + b, 0)
  return cols
}
// 範例欄寬：組別 順序 專題名稱 班級 學號 姓名 簽名
const COLS = colWidths([525, 330, 968, 427, 735, 919, 1096])
// 組長版：同樣 7 欄，組別（類型）改橫書。以 14pt 量：4 字類型、8 碼學號、「日三甲」、
// 4 字姓名都不換行，表頭 16pt 的「順序」也放得下；其餘給專題名稱（一行約 12 字）與簽名。
const LEADER_COLS = colWidths([580, 334, 1626, 441, 580, 557, 882])
const LEADER_SIZE = 28 // 14pt

const dxa = (w) => ({ size: w, type: WidthType.DXA })
const W = (i) => dxa(COLS[i])

// 範例列高（ATLEAST，內容多時自動長高）
const H_META = { value: 618, rule: HeightRule.ATLEAST }
const H_COLHEAD = { value: 719, rule: HeightRule.ATLEAST }
const H_ROW = { value: 680, rule: HeightRule.ATLEAST }
const H_LEADER_ROW = { value: 600, rule: HeightRule.ATLEAST }

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
function mergeCell(text, merge, width, opts = {}, runOpts) {
  if (merge === 'continue') {
    return cell([new Paragraph('')], {
      verticalMerge: VerticalMergeType.CONTINUE,
      width,
      ...opts,
    })
  }
  return cell([centered(text, runOpts)], { verticalMerge: VerticalMergeType.RESTART, width, ...opts })
}

function metaRow(label, value, labelSpan) {
  return new TableRow({
    cantSplit: true,
    tableHeader: true, // 換頁時重印會議資訊
    height: H_META,
    children: [
      cell([centered(label)], { columnSpan: labelSpan }),
      cell([new Paragraph({ children: [run(value)] })], { columnSpan: 7 - labelSpan }),
    ],
  })
}

// 表頭 5 列（標題、日期時間、地點、參加對象、欄位標題），兩種簽到表共用
function headerRows(data, labelSpan, labels, cols) {
  return [
    // 標題（跨 7 欄）
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
    }),
    metaRow('日期時間', data.datetime, labelSpan),
    metaRow('地　　點', data.location, labelSpan),
    metaRow('參加對象', data.audience, labelSpan),
    // 欄位標題
    new TableRow({
      cantSplit: true,
      tableHeader: true,
      height: H_COLHEAD,
      children: labels.map((t, i) => cell([centered(t, { bold: true })], { width: dxa(cols[i]) })),
    }),
  ]
}

// data: { subtitle, datetime, location, audience, groups: [{ order, category, name,
//   members: [{ class_label, student_id, name, isLeader }] }] }
export function buildReviewSigninDoc(data) {
  const rows = headerRows(data, 3, ['組別', '順序', '專題名稱', '班級', '學號', '姓名', '簽名'], COLS)

  // 學生列：組別／順序／專題名稱 只在「同一組的組員之間」合併，組與組一律切開，
  // 這樣每一組的上緣都有一條線，不會出現跨組的大空格。
  data.groups.forEach((g) => {
    if (!g.members.length) return // 空組別不出列
    g.members.forEach((m, mi) => {
      const top = mi === 0 ? TOP_THICK : {} // 每組第一列補粗線，取代合併格畫不出來的組內橫線
      rows.push(
        new TableRow({
          cantSplit: true,
          height: H_ROW,
          children: [
            // 組別欄直書（同範例）。docx 的 TextDirection 沒有 'tbRlV'（中文直書、字不轉向），
            // 它只有會把字轉 90° 的 'tbRl'，所以直接給 OOXML 值。
            mergeCell(g.category || '', mi === 0 ? 'restart' : 'continue', W(0), {
              textDirection: 'tbRlV',
              ...top,
            }),
            mergeCell(String(g.order), mi === 0 ? 'restart' : 'continue', W(1), top),
            mergeCell(g.name, mi === 0 ? 'restart' : 'continue', W(2), top),
            cell([centered(m.class_label)], { width: W(3), ...top }),
            cell([centered(m.student_id)], { width: W(4), ...top }),
            cell(
              // 組長標記另起一行，避免撐寬姓名欄
              m.isLeader ? [centered(m.name), centered('（組長）')] : [centered(m.name)],
              { width: W(5), ...top }
            ),
            cell([new Paragraph('')], { width: W(6), ...top }),
          ],
        })
      )
    })
  })

  return tableDoc(rows, COLS)
}

// 組長簽到版：一組一列，只列組長（沒設組長的組留白，現場手寫）。
// 組別（類型）與相鄰同類型的組合併，類型交界畫粗線，對應完整版「每組一條粗線」。
// data: { subtitle, datetime, location, audience, groups: [{ order, category, name,
//   leader: { class_label, student_id, name } | null }] }
export function buildLeaderSigninDoc(data) {
  const rows = headerRows(data, 2, ['組別', '順序', '專題名稱', '班級', '學號', '組長', '簽名'], LEADER_COLS)
  const LW = (i) => dxa(LEADER_COLS[i])
  const SMALL = { size: LEADER_SIZE }
  const small = (text) => [centered(text, SMALL)]

  data.groups.forEach((g, gi) => {
    const head = gi === 0 || (data.groups[gi - 1].category || '') !== (g.category || '')
    const top = head ? TOP_THICK : {}
    const l = g.leader
    rows.push(
      new TableRow({
        cantSplit: true,
        height: H_LEADER_ROW,
        children: [
          mergeCell(g.category || '', head ? 'restart' : 'continue', LW(0), top, SMALL),
          cell(small(String(g.order)), { width: LW(1), ...top }),
          cell(small(g.name), { width: LW(2), ...top }),
          cell(small(l?.class_label), { width: LW(3), ...top }),
          cell(small(l?.student_id), { width: LW(4), ...top }),
          cell(small(l?.name), { width: LW(5), ...top }),
          cell([new Paragraph('')], { width: LW(6), ...top }),
        ],
      })
    )
  })

  return tableDoc(rows, LEADER_COLS)
}

function tableDoc(rows, cols) {
  const table = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: cols,
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
        // Word 規定表格後面一定要有段落，沒給的話它開檔時自己補一個預設字高的，
        // 表格剛好滿頁時就會多出一張空白頁 → 自己放一個 1pt 的。
        children: [
          table,
          new Paragraph({
            spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT },
            children: [run('', { size: 2 })],
          }),
        ],
      },
    ],
  })
}

export function downloadReviewSigninDocx(data) {
  return downloadDocx(buildReviewSigninDoc(data), data.fileBase)
}

export function downloadLeaderSigninDocx(data) {
  return downloadDocx(buildLeaderSigninDoc(data), data.fileBase)
}

async function downloadDocx(doc, fileBase) {
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileBase}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
