// School years are stored and shown in ROC form, e.g. "114".
// This helper normalises any input (already-ROC "114", or a legacy western
// range like "2024-2025") to the ROC number string.
export function rocYear(y) {
  if (y === null || y === undefined || y === '') return ''
  const s = String(y).trim()
  if (/^\d{1,3}$/.test(s)) return s            // already ROC (e.g. 114)
  const m = s.match(/^(\d{4})/)                 // legacy range like 2024-2025
  if (m) return String(parseInt(m[1], 10) - 1911)
  return s
}

// Drop the leading grade-level prefix from a class so "三甲" -> "甲".
export function classLetter(c) {
  if (!c) return ''
  return String(c).trim().replace(/^[一二三四五六七八九十\d]+\s*年?/, '')
}

// Combined display of a student's year + class, e.g. "114甲".
// Falls back to just the ROC year when no class is given.
export function yearClass(year, c) {
  const y = rocYear(year)
  const k = classLetter(c)
  return k ? `${y}${k}` : y
}

// 班級字串把年級包在中間：「日三甲」= 日間部 + 三年級 + 甲班。
// 拆成年級段（含年級字）與班別段，供列表分欄顯示；沒有年級字時年級段為空。
const GRADE_CHARS = '一二三四五六七八九'
export function splitClass(c) {
  const s = String(c ?? '').trim()
  let i = -1
  for (let k = s.length - 1; k >= 0; k--) {
    if (GRADE_CHARS.includes(s[k])) { i = k; break }
  }
  return i < 0 ? { grade: '', letter: s } : { grade: s.slice(0, i + 1), letter: s.slice(i + 1) }
}
