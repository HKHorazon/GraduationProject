// 簽到表 Word 產生器的自我檢查：build → Packer 打包 → 解開 document.xml 檢查結構。
// 重點：欄寬全是 DXA 且貼齊版面、表頭 5 列會重印、組長版一組一列且一屆（19 組）塞得進一頁。
// 執行： cd frontend && node src/lib/test_attendanceYearDoc.mjs
import assert from 'node:assert/strict'
import { Packer } from 'docx'
import JSZip from 'jszip' // docx 本身的相依套件
import { buildReviewSigninDoc, buildLeaderSigninDoc } from './attendanceYearDoc.js'

const PAGE_H = 16838 - 567 * 2 // A4 直向扣掉上下 1cm
const CONTENT_W = 11906 - 567 * 2

async function xmlOf(doc) {
  const zip = await JSZip.loadAsync(await Packer.toBuffer(doc))
  return zip.file('word/document.xml').async('string')
}
const count = (xml, re) => (xml.match(re) ?? []).length
const rowsOf = (xml) => xml.match(/<w:tr>.*?<\/w:tr>/gs) ?? []
const textOf = (xml) => (xml.match(/<w:t[^>]*>[^<]*<\/w:t>/g) ?? []).map((t) => t.replace(/<[^>]+>/g, ''))
const gridSum = (xml) =>
  [...xml.matchAll(/<w:gridCol w:w="(\d+)"/g)].reduce((a, m) => a + Number(m[1]), 0)

function common(xml) {
  assert.ok(!/w:w="[\d.]+%"/.test(xml), '不可出現百分比寬度（Word 會判定毀損）')
  assert.equal(gridSum(xml), CONTENT_W, '欄寬總和要剛好貼齊版面')
  assert.equal(count(xml, /<w:tblHeader\/>/g), 5, '表頭 5 列要設 tableHeader')
  assert.ok(xml.includes('w:eastAsia="KaiTi"'), '中文字型要指定 eastAsia')
  assert.match(xml, /<\/w:tbl><w:p>/, '表格後要自己放 1pt 段落，否則 Word 補的預設段落會擠出空白頁')
}

const META = { subtitle: '第四屆（113級） 第三次專題書面審查 專題組長簽到表', datetime: '115年06月18日', location: 'MB106', audience: '各組組長' }
const leader = (n) => ({ class_label: '日三甲', student_id: `A1100${n}`, name: `組長${n}` })

// --- 1) 組長版：一組一列，相鄰同類型合併，沒組長留白 ---
{
  const xml = await xmlOf(
    buildLeaderSigninDoc({
      ...META,
      groups: [
        { order: 1, category: '遊戲', name: '妖怪ONLINE', leader: leader(1) },
        { order: 2, category: '遊戲', name: '星際貓', leader: leader(2) },
        { order: 3, category: '動畫', name: '沒組長的組', leader: null },
        { order: 4, category: '遊戲', name: '回頭的遊戲組', leader: leader(4) },
      ],
    })
  )
  common(xml)
  const rows = rowsOf(xml)
  assert.equal(rows.length, 5 + 4, '一組一列')
  // 遊戲(1,2) 合併；動畫、遊戲(4) 不相鄰 → 各自重新開始
  assert.equal(count(xml, /<w:vMerge w:val="restart"\/>/g), 3)
  assert.equal(count(xml, /<w:vMerge w:val="continue"\/>/g), 1)
  const texts = textOf(xml)
  for (const n of [1, 2, 4]) {
    assert.ok(texts.includes(`組長${n}`) && texts.includes(`A1100${n}`), `第 ${n} 組組長要出現`)
  }
  assert.ok(texts.includes('組長') && !texts.includes('姓名'), '欄位標題是「組長」')
  assert.deepEqual(textOf(rows[7]).filter(Boolean), ['動畫', '3', '沒組長的組'], '沒組長的組只留組別資訊，其餘留白')
}

// --- 2) 組長版頁數：參考範例那屆 19 組要塞得進一頁（Word 實測 19 組 1 頁、36 組 2 頁）---
{
  const groups = Array.from({ length: 19 }, (_, i) => ({
    order: i + 1, category: '遊戲', name: `第${i + 1}組`, leader: leader(i),
  }))
  const xml = await xmlOf(buildLeaderSigninDoc({ ...META, groups }))
  const heights = rowsOf(xml).map((r) => Number(r.match(/<w:trHeight w:val="(\d+)"/)[1]))
  // 標題列兩行 16pt，實際高度約 2 × 16pt × 1.3 行高，比設定的最小列高大
  heights[0] = Math.max(heights[0], Math.ceil(2 * 16 * 20 * 1.3))
  const total = heights.reduce((a, b) => a + b, 0)
  assert.ok(total <= PAGE_H, `19 組估計高 ${total} twips，超過一頁 ${PAGE_H}`)
}

// --- 3) 完整版沒被改壞：每位組員一列、空組別不出列 ---
{
  const m = (n, isLeader = false) => ({ class_label: '日三甲', student_id: `A1100${n}`, name: `學生${n}`, isLeader })
  const xml = await xmlOf(
    buildReviewSigninDoc({
      ...META,
      groups: [
        { order: 1, category: '遊戲', name: '妖怪ONLINE', members: [m(1, true), m(2), m(3)] },
        { order: 2, category: '動畫', name: '空組別', members: [] },
        { order: 3, category: '動畫', name: '星際貓', members: [m(4, true)] },
      ],
    })
  )
  common(xml)
  assert.equal(rowsOf(xml).length, 5 + 4, '每位組員一列，空組別不出列')
  assert.equal(count(xml, /<w:vMerge w:val="restart"\/>/g), 3 * 2, '組別／順序／專題名稱每組各合併一次')
  assert.equal(count(xml, /（組長）/g), 2)
}

console.log('attendanceYearDoc self-check OK')
