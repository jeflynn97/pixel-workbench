export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatMoney(n) {
  const num = Number(n) || 0
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 带币种前缀的金额格式化，例如 formatCurrency(88, 'SGD') -> "SGD 88.00"
export function formatCurrency(n, currency = 'RM') {
  return `${currency} ${formatMoney(n)}`
}

export function isSameMonth(dateStr, ref = new Date()) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

export function formatDateLabel(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
}
