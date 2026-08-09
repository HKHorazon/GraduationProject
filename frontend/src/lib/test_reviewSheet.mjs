// 審查評分 Excel 版型的自我檢查：build → 寫成 xlsx → 讀回 → parse，
// 分數要一模一樣，且自己指導的組別要是紅色且被跳過。
// 執行： cd frontend && node src/lib/test_reviewSheet.mjs
import assert from 'node:assert/strict'
import XLSX from 'xlsx-js-style'
import { buildSheet, parseSheet, toWorkbook, sheetToAoa } from './reviewSheet.js'

const criteria2 = [{ name: '創意', weight: 60 }, { name: '完成度', weight: 40 }]
const criteria1 = [{ name: '總分', weight: 100 }]

// g1 由 t1 指導、g2 由 t2 指導、g3 沒有指導老師
const GROUPS = [
  { id: 'g1', number: 1, name: '3D動畫', advisors: '陳老師', own: ['t1'] },
  { id: 'g2', number: 2, name: '主視覺組', advisors: '林老師', own: ['t2'] },
  { id: 'g3', number: 3, name: '遊戲開發', advisors: '', own: [] },
]
const REVIEWERS = ['t1', 't2', '外:王大明']
const LABELS = { t1: '陳老師', t2: '林老師', '外:王大明': '王大明（外審）' }
const NAME_TO_ID = { 陳老師: 't1', 林老師: 't2' }

function ctxFor(criteria, scores) {
  return {
    criteria,
    reviewers: REVIEWERS,
    labels: LABELS,
    groups: GROUPS,
    scoreOf: (gid, r) => scores[`${gid}|${r}`] ?? null,
    avgOf: () => ({ internal: 80, external: 70, final: 76 }),
    groupByNumber: (n) => GROUPS.find((g) => String(g.number) === n) ?? null,
    teacherIdByName: (n) => NAME_TO_ID[n] ?? null,
  }
}

function roundTrip(ctx, withScores) {
  const ws = buildSheet(ctx, { withScores })
  const buf = XLSX.write(toWorkbook(ws), { type: 'array', bookType: 'xlsx' })
  return { ws, parsed: parseSheet(ctx, sheetToAoa(buf)) }
}

// --- 1) 多評分項目：分數原樣往返 ---
const scores = {
  'g1|t2': { scores: [90, 80], total: 86, comment: '很有想法' },
  'g1|外:王大明': { scores: [70, 60], total: 66 },
  'g2|t1': { scores: [55, 65], total: 59 },
  'g3|t1': { scores: [100, 0], total: 60 },
  'g3|t2': { scores: [0, 100], total: 40 },
}
{
  const ctx = ctxFor(criteria2, scores)
  const { ws, parsed } = roundTrip(ctx, true)

  const got = Object.fromEntries(parsed.map((p) => [`${p.group_id}|${p.reviewer}`, p.scores]))
  assert.deepEqual(got, Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [k, v.scores])
  ), '分數往返後應完全相同')

  // 表頭：第一列是各評審、第一欄組別、第二欄指導老師
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 })
  assert.deepEqual(aoa[0].slice(0, 4), ['組別', '題目', '指導老師', '陳老師'])
  assert.deepEqual(aoa[0].slice(-3), ['系上平均', '外審平均', '加權總分'])
  // 每位評審的區塊：各評分項目 + 總分 + 評語
  assert.deepEqual(aoa[1].slice(3, 7), ['創意', '完成度', '總分', '評語'])
  assert.equal(aoa[2][1], '3D動畫', '第二欄是組別題目')
  assert.equal(aoa[2][2], '陳老師', '第三欄是該組的指導老師')

  // 自己指導的組別仍然出現，且該格是紅底的「—」
  const ownRef = XLSX.utils.encode_cell({ r: 2, c: 3 })   // 第1組 × 陳老師(t1)
  assert.equal(ws[ownRef].v, '—')
  // 寫檔時 rgb 會被正規化成 8 碼 ARGB（FFFFC7CE）
  assert.match(ws[ownRef].s.fill.fgColor.rgb, /FFC7CE$/, '自己組別的格子要塗紅')
  assert.ok(!parsed.some((p) => p.group_id === 'g1' && p.reviewer === 't1'), '紅色格不可被匯入')

  // 評語也要往返
  const withComment = parsed.find((p) => p.group_id === 'g1' && p.reviewer === 't2')
  assert.equal(withComment.comment, '很有想法', '評語要跟著往返')
  assert.equal(parsed.find((p) => p.reviewer === '外:王大明').comment, null, '沒評語就是 null')
}

// --- 2) 單一總分：兩列表頭仍然成立 ---
{
  const ctx = ctxFor(criteria1, { 'g1|t2': { scores: [88] }, 'g2|外:王大明': { scores: [61] } })
  const { parsed } = roundTrip(ctx, true)
  assert.deepEqual(
    parsed.sort((a, b) => a.group_id.localeCompare(b.group_id)),
    [
      { group_id: 'g1', reviewer: 't2', scores: [88], comment: null },
      { group_id: 'g2', reviewer: '外:王大明', scores: [61], comment: null },
    ]
  )
}

// --- 3) 空白範本讀回來是零筆（不會誤生 0 分） ---
{
  const { parsed } = roundTrip(ctxFor(criteria2, {}), false)
  assert.equal(parsed.length, 0, '空白範本不該產生任何評分')
}

// --- 4) 壞資料要擋下來 ---
{
  const ctx = ctxFor(criteria2, {})
  assert.throws(() => parseSheet(ctx, [['姓名'], []]), /表頭不符/)
  assert.throws(
    () => parseSheet(ctx, [
      ['組別', '題目', '指導老師', '林老師', '林老師'],
      ['', '', '', '創意', '完成度'],
      [1, '3D動畫', '陳老師', 999, 50],
    ]),
    /分數不合法/,
    '超過 100 要擋'
  )
  // 同一張表若那格是該老師自己指導的組，即使填了亂數也只會被跳過
  assert.deepEqual(
    parseSheet(ctx, [
      ['組別', '題目', '指導老師', '陳老師', '陳老師'],
      ['', '', '', '創意', '完成度'],
      [1, '3D動畫', '陳老師', 999, 50],
    ]),
    [],
    '自己指導的組別整格跳過，不會被驗證也不會匯入'
  )
  assert.throws(
    () => parseSheet(ctx, [
      ['組別', '題目', '指導老師', '陳老師', '陳老師'],
      ['', '', '', '創意', '完成度'],
      [9, '', '', 80, 80],
    ]),
    /找不到組別/
  )
  // 只填一半的評分項目 → 不合法，不可默默當 0
  assert.throws(
    () => parseSheet(ctx, [
      ['組別', '題目', '指導老師', '林老師', '林老師'],
      ['', '', '', '創意', '完成度'],
      [1, '3D動畫', '陳老師', 80, ''],
    ]),
    /分數不合法/
  )
}

console.log('reviewSheet round-trip OK')
