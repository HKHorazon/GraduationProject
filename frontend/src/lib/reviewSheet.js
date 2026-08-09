// 審查評分的 Excel 版型（畫面總覽、匯出、範本、匯入共用同一個矩陣格式）。
//
//   row1: 組別 | 題目 | 指導老師 | 陳老師 …(跨自己的欄) | 系上平均 | 外審平均 | 加權總分
//   row2:      |      |          |  項目A | 項目B | 總分 | 評語 |
//   row3+: 每一組一列
//
// 每位評審的區塊＝各評分項目 +（多項目時）總分 + 評語。總分是算出來的，匯入時忽略。
// 自己指導的組別照樣列出來，整個區塊填「—」並塗紅，匯入時自動跳過。
// 純函式：所有領域資料由呼叫端算好後傳進 ctx，方便單獨測試（見 test_reviewSheet.mjs）。
// default import：xlsx-js-style 是 CJS，`import *` 在原生 Node ESM 下拿不到 utils
import XLSX from 'xlsx-js-style'

export const EXT = '外:'
export const LEAD_COLS = ['組別', '題目', '指導老師']   // 每位評審的欄位之前的固定欄
export const AVG_COLS = ['系上平均', '外審平均', '加權總分']

const RED = {
  fill: { fgColor: { rgb: 'FFC7CE' } },
  font: { color: { rgb: '9C0006' }, bold: true },
  alignment: { horizontal: 'center' },
}
const HEAD = {
  font: { bold: true },
  fill: { fgColor: { rgb: 'EDEDED' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
}

/**
 * ctx = {
 *   criteria:  [{ name, weight }],
 *   reviewers: ['t1', '外:王大明'],          // 欄位順序
 *   labels:    { t1: '陳老師', '外:王大明': '王大明（外審）' },
 *   groups:    [{ id, number, name: '題目', advisors: '陳、林', own: ['t1'] }],  // own = 不可評此組的評審
 *   scoreOf:   (groupId, reviewer) => ({ scores: [], total, comment }) | null,
 *   avgOf:     (groupId) => ({ internal, external, final })          // null 表示沒有
 * }
 */
// 一位評審佔幾欄：各評分項目 +（多項目才有的）總分 + 評語
export function blockHeaders(criteria) {
  const names = criteria.map((c) => c.name)
  if (criteria.length > 1) names.push('總分')
  names.push('評語')
  return names
}

export function buildSheet(ctx, { withScores }) {
  const { criteria, reviewers, labels, groups } = ctx
  const sub = blockHeaders(criteria)
  const row1 = [...LEAD_COLS]
  const row2 = LEAD_COLS.map(() => '')
  for (const r of reviewers) {
    for (const h of sub) {
      row1.push(labels[r] ?? r)
      row2.push(h)
    }
  }
  row1.push(...AVG_COLS)
  row2.push(...AVG_COLS.map(() => ''))

  const body = []
  const reds = []
  for (const g of groups) {
    const row = [g.number, g.name ?? '', g.advisors]
    for (const r of reviewers) {
      if (g.own.includes(r)) {
        sub.forEach(() => { reds.push([body.length + 2, row.length]); row.push('—') })
        continue
      }
      const s = withScores ? ctx.scoreOf(g.id, r) : null
      criteria.forEach((_, i) => row.push(s ? s.scores[i] : ''))
      if (criteria.length > 1) row.push(s ? s.total : '')
      row.push(s?.comment ?? '')
    }
    const a = withScores ? ctx.avgOf(g.id) : {}
    row.push(a.internal ?? '', a.external ?? '', a.final ?? '')
    body.push(row)
  }

  const ws = XLSX.utils.aoa_to_sheet([row1, row2, ...body])
  const width = row1.length
  for (let c = 0; c < width; c++) {
    for (const r of [0, 1]) {
      const ref = XLSX.utils.encode_cell({ r, c })
      if (ws[ref]) ws[ref].s = HEAD
    }
  }
  for (const [r, c] of reds) {
    const ref = XLSX.utils.encode_cell({ r, c })
    ws[ref] = { ...(ws[ref] ?? { v: '—', t: 's' }), s: RED }
  }

  const merges = LEAD_COLS.map((_, c) => ({ s: { r: 0, c }, e: { r: 1, c } }))
  reviewers.forEach((_, i) => {
    const start = LEAD_COLS.length + i * sub.length
    merges.push({ s: { r: 0, c: start }, e: { r: 0, c: start + sub.length - 1 } })
  })
  AVG_COLS.forEach((_, i) => {
    const c = width - AVG_COLS.length + i
    merges.push({ s: { r: 0, c }, e: { r: 1, c } })
  })
  ws['!merges'] = merges
  ws['!cols'] = [
    { wch: 8 }, { wch: 30 }, { wch: 18 },
    ...Array(Math.max(0, width - LEAD_COLS.length - AVG_COLS.length)).fill({ wch: 12 }),
    ...AVG_COLS.map(() => ({ wch: 10 })),
  ]
  return ws
}

export function toWorkbook(ws) {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '評分')
  return wb
}

export function downloadSheet(ws, filename) {
  XLSX.writeFile(toWorkbook(ws), filename)
}

export function sheetToAoa(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' })
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, blankrows: false })
}

const EMPTY = (v) => v === '' || v === undefined || v === null || v === '—'

/**
 * 反向讀回矩陣。ctx 另需 groupByNumber(number) 與 teacherIdByName(name)。
 * 回傳 [{ group_id, reviewer, scores, comment }]，自己指導的組別自動跳過。
 */
export function parseSheet(ctx, aoa) {
  const { criteria } = ctx
  const n = criteria.length
  const head1 = (aoa[0] ?? []).map((v) => String(v ?? '').trim())
  const head2 = (aoa[1] ?? []).map((v) => String(v ?? '').trim())
  if (head1[0] !== '組別') {
    throw new Error('表頭不符：第一欄應為「組別」，請用「下載範本」的格式')
  }

  // 合併儲存格讀回來只有第一格有值 → 向右補齊評審名稱
  const first = LEAD_COLS.length
  const names = []
  let last = ''
  for (let c = first; c < head1.length; c++) {
    if (AVG_COLS.includes(head1[c]) || head1[c] === '平均') break
    if (head1[c]) last = head1[c]
    names[c] = last
  }

  const blocks = new Map()   // 評審顯示名稱 -> { cols: 各評分項目的欄索引, comment: 評語欄 }
  for (let c = first; c < names.length; c++) {
    const label = names[c]
    if (!label) continue
    if (!blocks.has(label)) blocks.set(label, { cols: Array(n).fill(-1), comment: -1 })
    const b = blocks.get(label)
    const h = head2[c]
    if (h === '評語') { b.comment = c; continue }
    if (h === '總分' && n > 1) continue          // 由各項算出來的，匯入時忽略
    const idx = n === 1 ? 0 : criteria.findIndex((it) => it.name === h)
    if (idx === -1) {
      throw new Error(`「${label}」的欄位「${h || '(空白)'}」不是這次審查的評分項目`)
    }
    b.cols[idx] = c
  }
  for (const [label, b] of blocks) {
    if (b.cols.some((c) => c === -1)) throw new Error(`「${label}」缺少部分評分項目欄位`)
  }
  if (!blocks.size) throw new Error('表頭找不到任何評審欄位')

  const out = []
  for (const row of aoa.slice(2)) {
    const raw = String(row[0] ?? '').trim()
    if (raw === '') continue
    const g = ctx.groupByNumber(raw)
    if (!g) throw new Error(`找不到組別「${raw}」`)
    for (const [label, b] of blocks) {
      const bare = label.replace(/[（(]外審[）)]$/, '').trim()
      const reviewer = ctx.teacherIdByName(bare) ?? `${EXT}${bare}`
      if (g.own.includes(reviewer)) continue      // 自己指導的組（紅色格）跳過
      const cells = b.cols.map((c) => row[c])
      if (cells.every(EMPTY)) continue
      const scores = cells.map((v) => {
        const num = Number(v)
        if (EMPTY(v) || Number.isNaN(num) || num < 0 || num > 100) {
          throw new Error(`第${g.number}組「${label}」的分數不合法：${v ?? '(空白)'}`)
        }
        return num
      })
      const comment = b.comment === -1 ? '' : String(row[b.comment] ?? '').trim()
      out.push({ group_id: g.id, reviewer, scores, comment: comment || null })
    }
  }
  return out
}
