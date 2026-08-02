import { isSameMonth } from './utils.js'

// transaction: { id, date, payMethod:'cash'|'bank'|'credit', isPublic:bool, category, place, amount, note }
// fixedExpense: { id, name, amount, active:bool, note }
// incomeRecord: { id, date, category, amount, note }
// assets: { cashHolding, bankBalance, otherAssets:[{id,name,amount}], otherLiabilities:[{id,name,amount}] }
// creditRepayments: [{id, date, amount}]

export function computeCreditCard(transactions, creditRepayments) {
  const totalDebt = transactions
    .filter((t) => t.payMethod === 'credit')
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
  return { total, cash, bank, otherAssets, otherLiabilities }
}

export function computeMonthSummary({ transactions, fixedExpenses, incomeRecords }, ref = new Date()) {
  const monthIncome = incomeRecords
    .filter((r) => isSameMonth(r.date, ref))
    .reduce((s, r) => s + Number(r.amount || 0), 0)

  const monthFixed = fixedExpenses
    .filter((f) => f.active)
    .reduce((s, f) => s + Number(f.amount || 0), 0)

  const monthTxThisMonth = transactions.filter((t) => isSameMonth(t.date, ref))
  const monthPersonalTx = monthTxThisMonth
    .filter((t) => !t.isPublic)
    .reduce((s, t) => s + Number(t.amount || 0), 0)
  const monthPublicTx = monthTxThisMonth
    .filter((t) => t.isPublic)
    .reduce((s, t) => s + Number(t.amount || 0), 0)

  const monthExpensePersonal = monthFixed + monthPersonalTx
  const remaining = monthIncome - monthExpensePersonal

  return {
    monthIncome,
    monthFixed,
    monthPersonalTx,
    monthExpensePersonal,
    monthPublicTx,
    remaining,
  }
}

export function computeCategoryBreakdown(transactions, ref = new Date()) {
  const monthTx = transactions.filter((t) => isSameMonth(t.date, ref) && !t.isPublic)
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

export function computePlaceBreakdown(transactions) {
  const playTx = transactions.filter((t) => t.category === '游玩费用' && t.place)
  const map = {}
  playTx.forEach((t) => {
    map[t.place] = (map[t.place] || 0) + Number(t.amount || 0)
  })
  return Object.entries(map)
    .map(([place, amount]) => ({ place, amount }))
    .sort((a, b) => b.amount - a.amount)
}
