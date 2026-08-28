// 學生／組別列表的 Excel 匯出（純函式：資料進、workbook 出，不碰 store 與 DOM）。
// 自我檢查： cd frontend && node src/lib/test_exportSheets.mjs
import XLSX from 'xlsx-js-style'
import { rocYear, yearClass } from './year.js'
import { statusLabel } from './studentStatus.js'

const WIDTH = {
  學年班級: 14, 學號: 12, 姓名: 12, 狀態: 10, 組別: 10, 指導老師: 18,
  專題類別: 14, 專題名稱: 30, 學年度: 10, 組號: 8, 類別: 14, 組員數: 8, 組員: 40,
}

function teacherNames(g, teachers) {
  return g.teacher_ids.map((tid) => teachers.find((t) => t.id === tid)?.name ?? tid).join('、')
}

// 沒分組的人老師掛在 advisor_id 上（代理指導），有分組的人老師從組別帶出來。
function advisorName(s, teachers) {
  const t = teachers.find((x) => x.id === s.advisor_id)
  return t ? `${t.name}（代理）` : ''
}

export function studentRows(students, { groups, teachers }) {
  return students.map((s) => {
    const g = groups.find((x) => x.id === s.group_id) ?? null
    return {
      學年班級: yearClass(s.school_year, s.class_),
      學號: s.student_id,
      姓名: s.name,
      狀態: statusLabel(s.status),
      組別: g ? `第${g.number}組` : (s.advisor_id ? '暫時分組' : '未分組'),
      指導老師: g ? teacherNames(g, teachers) : advisorName(s, teachers),
      專題類別: g?.category ?? '',
      專題名稱: g?.name ?? '',
    }
  })
}

export function groupRows(groups, { students, teachers }) {
  return groups.map((g) => {
    const members = students.filter((s) => s.group_id === g.id)
    return {
      學年度: `${rocYear(g.school_year)} 學年`,
      組號: g.number,
      專題名稱: g.name,
      類別: g.category ?? '',
      指導老師: teacherNames(g, teachers),
      組員數: members.length,
      組員: members.map((s) => (s.id === g.leader_id ? `${s.name}（組長）` : s.name)).join('、'),
    }
  })
}

// sheets: { 工作表名稱: rows }
export function buildWorkbook(sheets) {
  const wb = XLSX.utils.book_new()
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = Object.keys(rows[0] ?? {}).map((k) => ({ wch: WIDTH[k] ?? 14 }))
    XLSX.utils.book_append_sheet(wb, ws, name)
  }
  return wb
}

export function exportFileName(label) {
  return `${label}_${new Date().toISOString().slice(0, 10)}.xlsx`
}
