// 專題組別簽到表（書面審查）Word 產生器 — 版型比照
// docs/第三次專題書面審查各組簽到表.docx：一張大表，組別/順序/專題名稱直向合併，
// 上方有 日期時間 / 地點 / 參加對象 三列表頭。成品固定黑字白底（紙本），與畫面主題無關。
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalMergeType,
  WidthType,
} from 'docx'

const FONT = 'Microsoft JhengHei'
const BODY = 24 // 12pt
const TITLE = 32 // 16pt

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: '000000' }
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER }

// docx omits w:val when only `fill` is given, but OOXML requires it → Word refuses the file.
const shade = (fill) => ({ type: ShadingType.CLEAR, color: 'auto', fill })

function run(text, opts = {}) {
  return new TextRun({ text, font: { name: FONT, eastAsia: FONT }, size: BODY, ...opts })
}

function para(text, opts = {}) {
  return new Paragraph({ children: [run(text, opts.run)], ...opts.para })
}

function cell(children, opts = {}) {
  return new TableCell({
    borders: BORDERS,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children,
    ...opts,
  })
}

// vertical-merge helper: 'restart' shows text, 'continue' is an empty spanned cell.
function mergeCell(text, merge, width, opts = {}) {
  if (merge === 'continue') {
    return cell([new Paragraph('')], { verticalMerge: VerticalMergeType.CONTINUE, width, ...opts })
  }
  return cell(
    [new Paragraph({ alignment: opts.align ?? AlignmentType.CENTER, children: [run(text)] })],
    { verticalMerge: VerticalMergeType.RESTART, width, ...opts }
  )
}

// A4 直向可用寬度 = 11906 - 1440*2 邊界（twips）。
// docx@9 的 WidthType.PERCENTAGE 會輸出 w:w="10%"，Word 判定檔案毀損 → 一律用 DXA。
const CONTENT_W = 9026
const PCT = [10, 6, 24, 10, 14, 14, 22] // 組別 順序 專題名稱 班級 學號 姓名 簽名
const COLS = PCT.map((p) => Math.round((CONTENT_W * p) / 100))
const W = (pct) => ({ size: Math.round((CONTENT_W * pct) / 100), type: WidthType.DXA })

function headerCell(text) {
  return cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [run(text, { bold: true })] })], {
    shading: shade('F2F2F2'),
  })
}

function metaRow(label, value) {
  return new TableRow({
    cantSplit: true,
    children: [
      cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [run(label, { bold: true })] })], {
        columnSpan: 3,
        shading: shade('F2F2F2'),
      }),
      cell([new Paragraph({ children: [run(value)] })], { columnSpan: 4 }),
    ],
  })
}

// data: { subtitle, datetime, location, audience, groups: [{ order, category, name,
//   members: [{ class_label, student_id, name, isLeader }] }] }
export function buildReviewSigninDoc(data) {
  const rows = []

  // title (spans all 7 columns)
  rows.push(
    new TableRow({
      cantSplit: true,
      children: [
        cell(
          [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [run('弘光科技大學　多媒體遊戲發展與應用系', { bold: true, size: TITLE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [run(data.subtitle, { bold: true, size: TITLE })] }),
          ],
          { columnSpan: 7 }
        ),
      ],
    })
  )

  rows.push(metaRow('日期時間', data.datetime))
  rows.push(metaRow('地　　點', data.location))
  rows.push(metaRow('參加對象', data.audience))

  // column header
  rows.push(
    new TableRow({
      cantSplit: true,
      children: ['組別', '順序', '專題名稱', '班級', '學號', '姓名', '簽名'].map(headerCell),
    })
  )

  // student rows with vertical merges on 組別 / 順序 / 專題名稱
  let prevCat = null
  data.groups.forEach((g) => {
    if (!g.members.length) return // 空組別不出列，也不能影響類別合併
    const catRestart = !g.category || g.category !== prevCat
    prevCat = g.category
    g.members.forEach((m, mi) => {
      rows.push(
        new TableRow({
          cantSplit: true,
          height: { value: 560, rule: HeightRule.ATLEAST },
          children: [
            mergeCell(g.category || '', mi === 0 && catRestart ? 'restart' : 'continue', W(10)),
            mergeCell(String(g.order), mi === 0 ? 'restart' : 'continue', W(6)),
            mergeCell(g.name, mi === 0 ? 'restart' : 'continue', W(24), { align: AlignmentType.LEFT }),
            cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [run(m.class_label)] })], { width: W(10) }),
            cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [run(m.student_id)] })], { width: W(14) }),
            cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [run(m.isLeader ? `${m.name}（組長）` : m.name)] })], { width: W(14) }),
            cell([new Paragraph('')], { width: W(22) }),
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
  return new Document({ sections: [{ children: [table] }] })
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
