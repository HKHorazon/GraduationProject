// 顏色規範檢查（web-color skill 的自動化版本）。
// 掃 src/**/*.vue，抓出對比度不合格或違反雙主題規則的 class。
// 執行： cd frontend && node scripts/check-colors.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

// [正規表示式, 說明]。文字類的門檻都是 WCAG AA 4.5:1，實測值寫在說明裡。
const BANNED = [
  [/(?<![\w:-])text-slate-(400|500)(?![\w-])/g, '淺色底對比不足（slate-400=2.0、slate-500=3.7）→ text-slate-600 dark:text-slate-400'],
  [/dark:text-slate-(500|600)(?![\w-])/g, '深色底對比不足（3.2 / 2.0）→ dark:text-slate-400'],
  [/(?<![\w:-])text-(cyan-(400|600|700)|red-(400|500|600)|amber-(500|600|700)|emerald-(500|600|700)|blue-600)(?![\w-])/g,
   '淺色底狀態色對比不足 → cyan-800 / red-700 / amber-800 / emerald-800 / blue-700（深色用 dark: 前綴的 -400）'],
  [/(?<![\w:-])(bg|text|border)-\[#[0-9a-fA-F]{3,8}\]/g, '.vue 內不得寫原始 hex → 用 token 或元件 class'],
]

// 白字配淺色底：整段 class 內同時出現填色與 text-white 才算違規（跨行）
const WHITE_ON = /bg-(blue-600|blue-500|cyan-600|cyan-500|cyan-400|red-500|amber-500|amber-600|emerald-500|emerald-600)\b[\s\S]{0,120}?text-white/g
const WHITE_WHY = '白字對比不足（blue-600=4.35、cyan-500=2.6、red-500=3.76）→ 用 .btn-primary / .btn-danger'

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith('.vue')) out.push(p)
  }
  return out
}

let bad = 0
for (const file of walk(ROOT)) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(WHITE_ON)) {
    bad++
    const ln = src.slice(0, m.index).split('\n').length
    console.log(`${relative(ROOT, file)}:${ln}  ${m[0].split('\n')[0].trim()}…\n    ${WHITE_WHY}`)
  }
  const lines = src.split('\n')
  lines.forEach((line, i) => {
    for (const [re, why] of BANNED) {
      for (const m of line.matchAll(re)) {
        bad++
        console.log(`${relative(ROOT, file)}:${i + 1}  ${m[0]}\n    ${why}`)
      }
    }
  })
}

console.log(bad ? `\n✗ ${bad} 處違反 web-color 規範` : '✓ 顏色規範檢查通過')
process.exit(bad ? 1 : 0)
