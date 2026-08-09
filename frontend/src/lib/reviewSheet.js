// 審查評分的 Excel 版型（畫面總覽、匯出、範本、匯入共用同一個矩陣格式）。
//
//   row1: 組別 | 指導老師 | 陳老師 …(跨自己的評分項目欄) | 系上平均 | 外審平均 | 加權總分
//   row2:      |          |  項目A  |  項目B             |
//   row3+: 每一組一列
//
// 自己指導的組別照樣列出來，該格填「—」並塗紅，匯入時自動跳過。
// 純函式：所有領域資料由呼叫端算好後傳進 ctx，方便單獨測試（見 test_reviewSheet.mjs）。
// default import：xlsx-js-style 是 CJS，`import *` 在原生 Node ESM 下拿不到 utils
import XLSX from 'xlsx-js-style'

export const EXT = '外:'
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
 *   groups:    [{ id, number, advisors: '陳、林', own: ['t1'] }],   // own = 不可評此組的評審
 *   scoreOf:   (groupId, reviewer) => ({ scores: [] }) | null,
 *   avgOf:     (groupId) => ({ internal, external, final })          // null 表示沒有
 * }
 */
export function buildSheet(ctx, { withScores }) {
  const { criteria, reviewers, labels, groups } = ctx
  const row1 = ['組別', '指導老師']
  const row2 = ['', '']
  for (const r of reviewers) {
    for (const it of criteria) {
      row1.push(labels[r] ?? r)
      row2.push(it.name)
    }
  }
  row1.push(...AVG_COLS)
  row2.push('', '', '')

  const body = []
  const reds = []
  for (const g of groups) {
    const row = [g.number, g.advisors]
    for (const r of reviewers) {
      if (g.own.includes(r)) {
        criteria.forEach(() => { reds.push([body.length + 2, row.length]); row.push('—') })
        continue
      }
      const s = withScores ? ctx.scoreOf(g.id, r) : null
      criteria.forEach((_, i) => row.push(s ? s.scores[i] : ''))
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

  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
  ]
  if (criteria.length > 1) {
    reviewers.forEach((_, i) => {
      const start = 2 + i * criteria.length
      merges.push({ s: { r: 0, c: start }, e: { r: 0, c: start + criteria.length - 1 } })
    })
  }
  AVG_COLS.forEach((_, i) => {
    const c = width - AVG_COLS.length + i
    merges.push({ s: { r: 0, c }, e: { r: 1, c } })
  })
  ws['!merges'] = merges
  ws['!cols'] = [
    { wch: 8 }, { wch: 18 },
    ...Array(Math.max(0, width - 2 - AVG_COLS.length)).fill({ wch: 12 }),
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
  const names = []
  let last = ''
  for (let c = 2; c < head1.length; c++) {
    if (AVG_COLS.includes(head1[c]) || head1[c] === '平均') break
    if (head1[c]) last = head1[c]
    names[c] = last
  }

  const blocks = new Map()   // 評審顯示名稱 -> 各評分項目對應的欄索引
  for (let c = 2; c < names.length; c++) {
    const label = names[c]
    if (!label) continue
    if (!blocks.has(label)) blocks.set(label, Array(n).fill(-1))
    const cols = blocks.get(label)
    const idx = n === 1 ? 0 : criteria.findIndex((it) => it.name === head2[c])
    if (idx === -1) {
      throw new Error(`「${label}」的欄位「${head2[c] || '(空白)'}」不是這次審查的評分項目`)
    }
    cols[idx] = c
  }
  for (const [label, cols] of blocks) {
    if (cols.some((c) => c === -1)) throw new Error(`「${label}」缺少部分評分項目欄位`)
  }
  if (!blocks.size) throw new Error('表頭找不到任何評審欄位')

  const out = []
  for (const row of aoa.slice(2)) {
    const raw = String(row[0] ?? '').trim()
    if (raw === '') continue
    const g = ctx.groupByNumber(raw)
    if (!g) throw new Error(`找不到組別「${raw}」`)
    for (const [label, cols] of blocks) {
      const bare = label.replace(/[（(]外審[）)]$/, '').trim()
      const reviewer = ctx.teacherIdByName(bare) ?? `${EXT}${bare}`
      if (g.own.includes(reviewer)) continue      // 自己指導的組（紅色格）跳過
      const cells = cols.map((c) => row[c])
      if (cells.every(EMPTY)) continue
      const scores = cells.map((v) => {
        const num = Number(v)
        if (EMPTY(v) || Number.isNaN(num) || num < 0 || num > 100) {
          throw new Error(`第${g.number}組「${label}」的分數不合法：${v ?? '(空白)'}`)
        }
        return num
      })
      out.push({ group_id: g.id, reviewer, scores, comment: null })
    }
  }
  return out
}
