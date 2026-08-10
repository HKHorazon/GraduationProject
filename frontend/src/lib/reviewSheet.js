// 審查評分的 Excel 版型：一位評審一張工作表（範本、匯出、匯入共用）。
//
//   A1:      評審：陳老師            ← 匯入時靠這格認人，不要改
//   第 2 列: 組別 | 題目 | 指導老師 | 創意 (60%) | 完成度 (40%) | 總分 | 評語
//   第 3 列起: 該評審可以評的組別（自己指導的組直接不列出來）
//
// 總分是各項目算出來的，匯入時忽略。匯出成績時多一張「總覽」工作表（各組平均），匯入時自動略過。
// 純函式：所有領域資料由呼叫端算好後傳進 ctx，方便單獨測試（見 test_reviewSheet.mjs）。
// default import：xlsx-js-style 是 CJS，`import *` 在原生 Node ESM 下拿不到 utils
import XLSX from 'xlsx-js-style'

export const EXT = '外:'
export const LEAD_COLS = ['組別', '題目', '指導老師']   // 每張表最左邊的固定欄
export const AVG_COLS = ['系上平均', '外審平均', '加權總分']
const TITLE = '評審：'
const SUMMARY = '總覽'
const HINT = '分數 0–100，未評分請整列留白'

const HEAD = {
  font: { bold: true },
  fill: { fgColor: { rgb: 'EDEDED' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
}
const TITLE_S = { font: { bold: true, sz: 13 } }
const NOTE_S = { font: { italic: true, color: { rgb: '808080' } } }

/**
 * ctx = {
 *   criteria:  [{ name, weight }],
 *   reviewers: ['t1', '外:王大明'],          // 工作表順序
 *   labels:    { t1: '陳老師', '外:王大明': '王大明（外審）' },
 *   groups:    [{ id, number, name: '題目', advisors: '陳、林', own: ['t1'] }],  // own = 不可評此組的評審
 *   scoreOf:   (groupId, reviewer) => ({ scores: [], total, comment }) | null,
 *   avgOf:     (groupId) => ({ internal, external, final })          // 只有「總覽」用得到
 * }
 */
// 一位評審的評分欄：各評分項目（帶權重）+（多項目才有的）總分 + 評語
export function columnHeaders(criteria) {
  const names = criteria.map((c) => `${c.name} (${c.weight}%)`)
  if (criteria.length > 1) names.push('總分')
  names.push('評語')
  return names
}

const stripWeight = (v) => String(v ?? '').trim().replace(/\s*[（(]\s*\d+\s*%\s*[）)]$/, '')

// Excel 工作表名稱：31 字上限、不能有 : \ / ? * [ ]，且同一活頁簿內不能重複
function sheetName(label, used) {
  const base = (label.replace(/[:\\/?*[\]]/g, '_').trim().slice(0, 28)) || '評審'
  let name = base
  let i = 2
  while (used.has(name)) name = `${base}(${i++})`
  used.add(name)
  return name
}

function styleRow(ws, r, n, style) {
  for (let c = 0; c < n; c++) {
    const ref = XLSX.utils.encode_cell({ r, c })
    if (ws[ref]) ws[ref].s = style
  }
}

function reviewerSheet(ctx, reviewer, withScores) {
  const { criteria, labels, groups } = ctx
  const head = [...LEAD_COLS, ...columnHeaders(criteria)]
  const title = [`${TITLE}${labels[reviewer] ?? reviewer}`, '', '', HINT]

  const body = []
  for (const g of groups) {
    if (g.own.includes(reviewer)) continue          // 自己指導的組不列出來
    const row = [g.number, g.name ?? '', g.advisors]
    const s = withScores ? ctx.scoreOf(g.id, reviewer) : null
    criteria.forEach((_, i) => row.push(s ? s.scores[i] : ''))
    if (criteria.length > 1) row.push(s ? s.total : '')
    row.push(s?.comment ?? '')
    body.push(row)
  }

  const ws = XLSX.utils.aoa_to_sheet([title, head, ...body])
  if (ws.A1) ws.A1.s = TITLE_S
  if (ws.D1) ws.D1.s = NOTE_S
  styleRow(ws, 1, head.length, HEAD)
  ws['!cols'] = [
    { wch: 8 }, { wch: 30 }, { wch: 18 },
    ...criteria.map(() => ({ wch: 14 })),
    ...(criteria.length > 1 ? [{ wch: 10 }] : []),
    { wch: 40 },
  ]
  return ws
}

function summarySheet(ctx) {
  const head = [...LEAD_COLS, ...AVG_COLS]
  const body = ctx.groups.map((g) => {
    const a = ctx.avgOf(g.id) ?? {}
    return [g.number, g.name ?? '', g.advisors, a.internal ?? '', a.external ?? '', a.final ?? '']
  })
  const ws = XLSX.utils.aoa_to_sheet([head, ...body])
  styleRow(ws, 0, head.length, HEAD)
  ws['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 18 }, ...AVG_COLS.map(() => ({ wch: 10 }))]
  return ws
}

export function buildWorkbook(ctx, { withScores }) {
  const wb = XLSX.utils.book_new()
  const used = new Set()
  if (withScores) {
    used.add(SUMMARY)
    XLSX.utils.book_append_sheet(wb, summarySheet(ctx), SUMMARY)
  }
  for (const r of ctx.reviewers) {
    XLSX.utils.book_append_sheet(wb, reviewerSheet(ctx, r, withScores),
                                 sheetName(ctx.labels[r] ?? r, used))
  }
  return wb
}

export function downloadWorkbook(wb, filename) {
  XLSX.writeFile(wb, filename)
}

const EMPTY = (v) => v === '' || v === undefined || v === null || v === '—'

// 工作表標題（「評審：王大明（外審）」）→ 評審 key
function reviewerOf(ctx, label) {
  const bare = label.replace(/[（(]外審[）)]$/, '').trim()
  if (!bare) throw new Error('有一張工作表的 A1 沒有寫評審姓名')
  return ctx.teacherIdByName(bare) ?? `${EXT}${bare}`
}

function parseReviewerSheet(ctx, aoa, sheet, reviewer) {
  const { criteria } = ctx
  const head = (aoa[1] ?? []).map(stripWeight)
  if (head[0] !== '組別') {
    throw new Error(`工作表「${sheet}」的第 2 列不是表頭，請用「下載範本」的格式`)
  }

  const cols = Array(criteria.length).fill(-1)
  let commentCol = -1
  for (let c = LEAD_COLS.length; c < head.length; c++) {
    const h = head[c]
    if (!h) continue
    if (h === '評語') { commentCol = c; continue }
    const idx = criteria.findIndex((it) => it.name === h)
    if (idx !== -1) { cols[idx] = c; continue }
    if (h === '總分') continue                      // 由各項算出來的，匯入時忽略
    throw new Error(`工作表「${sheet}」的欄位「${h}」不是這次審查的評分項目`)
  }
  if (cols.some((c) => c === -1)) {
    throw new Error(`工作表「${sheet}」缺少部分評分項目欄位`)
  }

  const out = []
  for (const row of aoa.slice(2)) {
    const raw = String(row[0] ?? '').trim()
    if (raw === '') continue
    const g = ctx.groupByNumber(raw)
    if (!g) throw new Error(`工作表「${sheet}」找不到組別「${raw}」`)
    if (g.own.includes(reviewer)) continue          // 自己指導的組，填了也跳過
    const cells = cols.map((c) => row[c])
    if (cells.every(EMPTY)) continue
    const scores = cells.map((v) => {
      const num = Number(v)
      if (EMPTY(v) || Number.isNaN(num) || num < 0 || num > 100) {
        throw new Error(`工作表「${sheet}」第${g.number}組的分數不合法：${v ?? '(空白)'}`)
      }
      return num
    })
    const comment = commentCol === -1 ? '' : String(row[commentCol] ?? '').trim()
    out.push({ group_id: g.id, reviewer, scores, comment: comment || null })
  }
  return out
}

/**
 * 反向讀回整本活頁簿。ctx 另需 groupByNumber(number) 與 teacherIdByName(name)。
 * A1 沒有「評審：」的工作表（例如「總覽」）一律略過。
 * 回傳 [{ group_id, reviewer, scores, comment }]。
 */
export function parseWorkbook(ctx, buffer) {
  const wb = XLSX.read(buffer, { type: 'array' })
  const out = []
  let found = 0
  for (const sheet of wb.SheetNames) {
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, blankrows: false })
    const a1 = String(aoa[0]?.[0] ?? '').trim()
    if (!a1.startsWith(TITLE)) continue
    found++
    out.push(...parseReviewerSheet(ctx, aoa, sheet, reviewerOf(ctx, a1.slice(TITLE.length))))
  }
  if (!found) {
    throw new Error('格式不符：每位評審要各自一張工作表，A1 是「評審：姓名」。請用「下載範本」重新填寫')
  }
  return out
}
