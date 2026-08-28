// 學生／組別匯出的自我檢查：build → 寫成 xlsx → 讀回 → 欄位與值一模一樣。
// 執行： cd frontend && node src/lib/test_exportSheets.mjs
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import XLSX from 'xlsx-js-style'
import { studentRows, groupRows, buildWorkbook, exportFileName } from './exportSheets.js'

const teachers = [{ id: 't1', name: '陳老師' }, { id: 't2', name: '林老師' }]
const groups = [
  { id: 'g1', number: 1, name: '3D動畫', category: '動畫', school_year: '114', teacher_ids: ['t1', 't2'], leader_id: 's1' },
  { id: 'g2', number: 2, name: '遊戲開發', category: null, school_year: '113', teacher_ids: [], leader_id: null },
]
const students = [
  { id: 's1', student_id: 'A11001', name: '王大明', class_: '三甲', school_year: '114', group_id: 'g1', status: 'active' },
  { id: 's2', student_id: 'A11002', name: '李小華', class_: '三甲', school_year: '114', group_id: 'g1', status: 'suspended' },
  { id: 's3', student_id: 'A11003', name: '張三', class_: null, school_year: '113', group_id: null, status: 'exempted' },
  { id: 's4', student_id: 'A11004', name: '舊資料', class_: null, school_year: '113', group_id: null, status: 'inactive' },
  { id: 's5', student_id: 'A11005', name: '代理生', class_: null, school_year: '113', group_id: null, advisor_id: 't1', status: 'active' },
]

const sRows = studentRows(students, { groups, teachers })
assert.equal(sRows[0]['學年班級'], '114甲')
assert.equal(sRows[0]['組別'], '第1組')
assert.equal(sRows[0]['指導老師'], '陳老師、林老師')
assert.equal(sRows[1]['狀態'], '休學')
assert.equal(sRows[2]['狀態'], '抵免')
assert.equal(sRows[2]['組別'], '未分組')
assert.equal(sRows[2]['指導老師'], '')     // 沒組也沒代理老師
assert.equal(sRows[3]['狀態'], '休退學') // 舊值仍看得懂
assert.equal(sRows[4]['組別'], '暫時分組')        // 沒組但有代理指導
assert.equal(sRows[4]['指導老師'], '陳老師（代理）')

const gRows = groupRows(groups, { students, teachers })
assert.equal(gRows[0]['學年度'], '114 學年')
assert.equal(gRows[0]['組員數'], 2)
assert.equal(gRows[0]['組員'], '王大明（組長）、李小華')
assert.equal(gRows[1]['指導老師'], '')
assert.equal(gRows[1]['組員'], '')

// round-trip
const wb = buildWorkbook({ 學生: sRows, 組別: gRows })
assert.deepEqual(wb.SheetNames, ['學生', '組別'])
assert.equal(wb.Sheets['學生']['!cols'].length, Object.keys(sRows[0]).length)

const file = path.join(os.tmpdir(), 'test_exportSheets.xlsx')
XLSX.writeFile(wb, file)
const back = XLSX.read(fs.readFileSync(file), { type: 'buffer' })
assert.deepEqual(XLSX.utils.sheet_to_json(back.Sheets['學生'], { defval: '' }), sRows.map(normalise))
assert.deepEqual(XLSX.utils.sheet_to_json(back.Sheets['組別'], { defval: '' }), gRows.map(normalise))
fs.unlinkSync(file)

assert.match(exportFileName('學生列表'), /^學生列表_\d{4}-\d{2}-\d{2}\.xlsx$/)

// Excel 讀回時空字串就是空字串，null 不存在——確保 build 端沒有塞 null/undefined
function normalise(row) {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => {
    assert.ok(v !== null && v !== undefined, `${k} 不可為 null`)
    return [k, v]
  }))
}

console.log('test_exportSheets: OK')
