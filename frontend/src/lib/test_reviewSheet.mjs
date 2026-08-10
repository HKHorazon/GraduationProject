// 審查評分 Excel 版型的自我檢查：build → 寫成 xlsx → 讀回 → parse，
// 分數要一模一樣，且自己指導的組別不會出現在該評審的工作表裡。
// 執行： cd frontend && node src/lib/test_reviewSheet.mjs
import assert from 'node:assert/strict'
import XLSX from 'xlsx-js-style'
import { buildWorkbook, parseWorkbook } from './reviewSheet.js'

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

const write = (wb) => XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
const aoaOf = (wb, name) => XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 })

function roundTrip(ctx, withScores) {
  const wb = buildWorkbook(ctx, { withScores })
  return { wb, parsed: parseWorkbook(ctx, write(wb)) }
}

// 用自訂 aoa 湊一本活頁簿，測壞資料
function wbOf(sheets) {
  const wb = XLSX.utils.book_new()
  for (const [name, aoa] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name)
  }
  return write(wb)
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
  const { wb, parsed } = roundTrip(ctx, true)

  const got = Object.fromEntries(parsed.map((p) => [`${p.group_id}|${p.reviewer}`, p.scores]))
  assert.deepEqual(got, Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [k, v.scores])
  ), '分數往返後應完全相同')

  // 匯出成績：總覽 + 一位評審一張表
  assert.deepEqual(wb.SheetNames, ['總覽', '陳老師', '林老師', '王大明（外審）'])
  assert.deepEqual(aoaOf(wb, '總覽')[0], ['組別', '題目', '指導老師', '系上平均', '外審平均', '加權總分'])

  const a = aoaOf(wb, '陳老師')
  assert.equal(a[0][0], '評審：陳老師', 'A1 是評審姓名，匯入靠這格認人')
  assert.deepEqual(a[1], ['組別', '題目', '指導老師', '創意 (60%)', '完成度 (40%)', '總分', '評語'])
  // t1 指導 g1 → 第 1 組不該出現在陳老師的表裡
  assert.deepEqual(a.slice(2).map((r) => r[0]), [2, 3], '自己指導的組別不列出來')
  assert.equal(a[2][1], '主視覺組')
  assert.equal(a[2][2], '林老師')
  assert.ok(!parsed.some((p) => p.group_id === 'g1' && p.reviewer === 't1'))

  // 評語也要往返
  const withComment = parsed.find((p) => p.group_id === 'g1' && p.reviewer === 't2')
  assert.equal(withComment.comment, '很有想法', '評語要跟著往返')
  assert.equal(parsed.find((p) => p.reviewer === '外:王大明').comment, null, '沒評語就是 null')
}

// --- 2) 單一總分：欄位名稱與評分項目同名也不會被當成計算欄 ---
{
  const ctx = ctxFor(criteria1, { 'g1|t2': { scores: [88] }, 'g2|外:王大明': { scores: [61] } })
  const { wb, parsed } = roundTrip(ctx, true)
  assert.deepEqual(aoaOf(wb, '林老師')[1], ['組別', '題目', '指導老師', '總分 (100%)', '評語'])
  assert.deepEqual(
    parsed.sort((a, b) => a.group_id.localeCompare(b.group_id)),
    [
      { group_id: 'g1', reviewer: 't2', scores: [88], comment: null },
      { group_id: 'g2', reviewer: '外:王大明', scores: [61], comment: null },
    ]
  )
}

// --- 3) 空白範本讀回來是零筆（不會誤生 0 分），也沒有總覽 ---
{
  const ctx = ctxFor(criteria2, {})
  const { wb, parsed } = roundTrip(ctx, false)
  assert.deepEqual(wb.SheetNames, ['陳老師', '林老師', '王大明（外審）'], '範本沒有總覽')
  assert.equal(parsed.length, 0, '空白範本不該產生任何評分')
}

// --- 4) 壞資料要擋下來 ---
{
  const ctx = ctxFor(criteria2, {})
  const head = ['組別', '題目', '指導老師', '創意 (60%)', '完成度 (40%)', '總分', '評語']

  // 舊的矩陣版型（A1 是「組別」）不再接受
  assert.throws(
    () => parseWorkbook(ctx, wbOf({ 評分: [['組別', '題目', '指導老師', '陳老師'], []] })),
    /格式不符/
  )
  assert.throws(
    () => parseWorkbook(ctx, wbOf({ 林老師: [['評審：林老師'], ['姓名'], []] })),
    /不是表頭/
  )
  assert.throws(
    () => parseWorkbook(ctx, wbOf({ 林老師: [['評審：林老師'], head, [1, '3D動畫', '陳老師', 999, 50]] })),
    /分數不合法/,
    '超過 100 要擋'
  )
  // 只填一半的評分項目 → 不合法，不可默默當 0
  assert.throws(
    () => parseWorkbook(ctx, wbOf({ 林老師: [['評審：林老師'], head, [1, '3D動畫', '陳老師', 80, '']] })),
    /分數不合法/
  )
  assert.throws(
    () => parseWorkbook(ctx, wbOf({ 林老師: [['評審：林老師'], head, [9, '', '', 80, 80]] })),
    /找不到組別/
  )
  assert.throws(
    () => parseWorkbook(ctx, wbOf({ 林老師: [['評審：林老師'], [...head.slice(0, 4), '手感'], []] })),
    /不是這次審查的評分項目/
  )
  // 老師自己加回自己指導的組 → 整列跳過，不會被驗證也不會匯入
  assert.deepEqual(
    parseWorkbook(ctx, wbOf({ 陳老師: [['評審：陳老師'], head, [1, '3D動畫', '陳老師', 999, 50]] })),
    []
  )
  // 總覽被略過，但整本至少要有一張評審表
  assert.throws(
    () => parseWorkbook(ctx, wbOf({ 總覽: [['組別', '題目', '指導老師', '系上平均']] })),
    /格式不符/
  )
}

console.log('reviewSheet round-trip OK')
