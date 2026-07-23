// 專題製作出席記錄表（全學年）Word 產生器。
// 由 DocumentsExportView 以動態 import 載入，docx 套件因此獨立成 async chunk，
// 不會拖慢頁面本身的載入。Word 成品固定黑字白底（紙本），與畫面主題無關。
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
  WidthType,
} from 'docx'

const FONT = 'Microsoft JhengHei'
const BODY = 24 // half-points = 12pt（不縮小字）
const TITLE = 32 // 16pt

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: '000000' }
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER }

// docx omits w:val when only `fill` is given, but OOXML requires it → Word refuses the file.
const shade = (fill) => ({ type: ShadingType.CLEAR, color: 'auto', fill })

function run(text, opts = {}) {
  return new TextRun({ text, font: { name: FONT, eastAsia: FONT }, size: BODY, ...opts })
}

function cell(children, opts = {}) {
  return new TableCell({ borders: BORDERS, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children, ...opts })
}

function headerCell(text, width) {
  return cell(
    [new Paragraph({ alignment: AlignmentType.CENTER, children: [run(text, { bold: true })] })],
    { width: { size: width, type: WidthType.PERCENTAGE }, shading: shade('F2F2F2') }
  )
}

// group: { number, name, category, teachers, members: [{ student_id, name }] }
function groupTable(group) {
  const meta = [
    `第 ${group.number} 組　專題題目：${group.name}`,
    `指導老師：${group.teachers || '＿＿＿＿'}${group.category ? `　類別：${group.category}` : ''}`,
  ]
  const rows = [
    new TableRow({
      cantSplit: true,
      children: [
        cell(
          meta.map((line, i) =>
            new Paragraph({ children: [run(line, { bold: i === 0 })] })
          ),
          { columnSpan: 3, shading: shade('E8E8E8') }
        ),
      ],
    }),
    new TableRow({
      cantSplit: true,
      children: [headerCell('學號', 22), headerCell('姓名', 22), headerCell('簽名', 56)],
    }),
    ...group.members.map((m) =>
      new TableRow({
        cantSplit: true,
        height: { value: 680, rule: HeightRule.ATLEAST }, // 簽名格高度約 1.2cm
        children: [
          cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [run(m.student_id)] })], {
            width: { size: 22, type: WidthType.PERCENTAGE },
          }),
          cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [run(m.name)] })], {
            width: { size: 22, type: WidthType.PERCENTAGE },
          }),
          cell([new Paragraph('')], { width: { size: 56, type: WidthType.PERCENTAGE } }),
        ],
      })
    ),
  ]
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })
}

// data: { yearLabel, groups: [...] }（yearLabel 為民國學年字串，如 "113"）
export function buildAttendanceYearDoc(data) {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [run('多媒體遊戲發展與應用系　專題製作出席記錄表', { bold: true, size: TITLE })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 320 },
      children: [run(`${data.yearLabel} 學年度　　日期：＿＿＿年＿＿月＿＿日`)],
    }),
  ]
  data.groups.forEach((g, i) => {
    children.push(groupTable(g))
    if (i < data.groups.length - 1) children.push(new Paragraph({ spacing: { after: 240 }, text: '' }))
  })

  return new Document({ sections: [{ children }] })
}

export async function downloadAttendanceYearDocx(data) {
  const blob = await Packer.toBlob(buildAttendanceYearDoc(data))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `專題製作出席記錄表_${data.yearLabel}學年.docx`
  a.click()
  URL.revokeObjectURL(url)
}
