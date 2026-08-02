import { isSameMonth } from './utils.js'

// transaction: { id, date, payMethod:'cash'|'bank'|'credit', isPublic:bool, category, place, amount, note, currency:'RM'|'SGD' }
// fixedExpense: { id, name, amount, active:bool, note }  -- 固定支出统一按 RM 计算
// incomeRecord: { id, date, category, amount, note }      -- 收入统一按 RM 计算
// assets: { cashHolding, bankBalance, sgdCash, sgdBank, otherAssets:[{id,name,amount}], otherLiabilities:[{id,name,amount}] }
// creditRepayments: [{id, date, amount}]

// 没有 currency 字段的旧数据一律当作 RM，保证老数据兼容
export function txCurrency(t) {
  return t.currency || 'RM'
}

export function computeCreditCard(transactions, creditRepayments) {
  // 信用卡目前仅按 RM 计算（新币消费默认走现金/银行）
  const totalDebt = transactions
    .filter((t) => t.payMethod === 'credit' && txCurrency(t) === 'RM')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)
  const repaid = (creditRepayments || []).reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const remaining = Math.max(0, totalDebt - repaid)
  return { totalDebt, repaid, remaining }
}

export function computeTotalAssets(assets, creditRemaining) {
  const cash = Number(assets?.cashHolding || 0)
  const bank = Number(assets?.bankBalance || 0)
  const otherAssets = (assets?.otherAssets || []).reduce((s, a) => s + Number(a.amount || 0), 0)
  const otherLiabilities = (assets?.otherLiabilities || []).reduce((s, a) => s + Number(a.amount || 0), 0)
  const total = cash + bank + otherAssets - otherLiabilities - creditRemaining

  const sgdCash = Number(assets?.sgdCash || 0)
  const sgdBank = Number(assets?.sgdBank || 0)
  const sgdTotal = sgdCash + sgdBank

  return { total, cash, bank, otherAssets, otherLiabilities, sgdCash, sgdBank, sgdTotal }
}

export function computeMonthSummary({ transactions, fixedExpenses, incomeRecords }, ref = new Date()) {
  // 收入 / 固定支出统一按 RM 计算
  const monthIncome = incomeRecords
    .filter((r) => isSameMonth(r.date, ref))
    .reduce((s, r) => s + Number(r.amount || 0), 0)

  const monthFixed = fixedExpenses
    .filter((f) => f.active)
    .reduce((s, f) => s + Number(f.amount || 0), 0)

  const monthTxThisMonth = transactions.filter((t) => isSameMonth(t.date, ref))
  const rmTxThisMonth = monthTxThisMonth.filter((t) => txCurrency(t) === 'RM')
  const sgdTxThisMonth = monthTxThisMonth.filter((t) => txCurrency(t) === 'SGD')

  const monthPersonalTx = rmTxThisMonth
    .filter((t) => !t.isPublic)
    .reduce((s, t) => s + Number(t.amount || 0), 0)
  const monthPublicTx = rmTxThisMonth
    .filter((t) => t.isPublic)
    .reduce((s, t) => s + Number(t.amount || 0), 0)

  const monthExpensePersonal = monthFixed + monthPersonalTx
  const remaining = monthIncome - monthExpensePersonal

  // 新币消费单独统计，不并入 RM 预算（不做汇率换算，避免误差）
  const sgdMonthPersonal = sgdTxThisMonth
    .filter((t) => !t.isPublic)
    .reduce((s, t) => s + Number(t.amount || 0), 0)
  const sgdMonthPublic = sgdTxThisMonth
    .filter((t) => t.isPublic)
    .reduce((s, t) => s + Number(t.amount || 0), 0)

  return {
    monthIncome,
    monthFixed,
    monthPersonalTx,
    monthExpensePersonal,
    monthPublicTx,
    remaining,
    sgdMonthPersonal,
    sgdMonthPublic,
  }
}

export function computeCategoryBreakdown(transactions, currency = 'RM', ref = new Date()) {
  const monthTx = transactions.filter(
    (t) => isSameMonth(t.date, ref) && !t.isPublic && txCurrency(t) === currency
  )
  const total = monthTx.reduce((s, t) => s + Number(t.amount || 0), 0)
  const map = {}
  monthTx.forEach((t) => {
    map[t.category] = (map[t.category] || 0) + Number(t.amount || 0)
  })
  return Object.entries(map)
    .map(([category, amount]) => ({
      category,
      amount,
      pct: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export function computePlaceBreakdown(transactions, currency = 'RM') {
  const playTx = transactions.filter(
    (t) => t.category === '游玩费用' && t.place && txCurrency(t) === currency
  )
  const map = {}
  playTx.forEach((t) => {
    map[t.place] = (map[t.place] || 0) + Number(t.amount || 0)
  })
  return Object.entries(map)
    .map(([place, amount]) => ({ place, amount }))
    .sort((a, b) => b.amount - a.amount)
}
