// 姓名個資混淆：未登入時人名以「張O明」形式顯示。
// 規則：保留姓氏（第一字）與最後一字，中間以 O 取代；
// 兩字名（張明）→ 張O；單字或空值原樣返回。
export function maskName(name) {
  if (!name || typeof name !== 'string') return name
  const chars = [...name.trim()]
  if (chars.length < 2) return name
  if (chars.length === 2) return chars[0] + 'O'
  return chars[0] + 'O'.repeat(chars.length - 2) + chars[chars.length - 1]
}
