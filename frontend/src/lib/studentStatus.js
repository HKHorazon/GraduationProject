// 學生狀態：active（在學）以外都算離開，理由分成休學／退學／抵免。
export const INACTIVE_STATUSES = [
  { value: 'suspended', label: '休學' },
  { value: 'withdrawn', label: '退學' },
  { value: 'exempted', label: '抵免' },
]

const LABELS = {
  active: '在學',
  inactive: '休退學', // ponytail: 舊資料相容，新資料只會寫入上面三種
  ...Object.fromEntries(INACTIVE_STATUSES.map((o) => [o.value, o.label])),
}

export function statusLabel(status) {
  return LABELS[status] ?? status
}
