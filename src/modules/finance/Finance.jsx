import React, { useState } from 'react'
import { Plus, Trash2, MapPin, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLocalData } from '../../lib/useLocalData.js'
import {
  Card, Button, Input, Select, SegmentedTabs, SectionTitle,
  EmptyState, Modal, ConfirmDialog, Tag, useToast,
} from '../../components/ui.jsx'
import { genId, todayStr, formatMoney, formatCurrency, formatDateLabel } from '../../lib/utils.js'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, PAY_METHODS, CURRENCIES } from '../../lib/seed.js'
import {
  computeCreditCard, computeTotalAssets, computeMonthSummary,
  computeCategoryBreakdown, computePlaceBreakdown,
} from '../../lib/financeCalc.js'

const TABS = [
  { value: 'overview', label: '总览' },
  { value: 'calendar', label: '日历' },
  { value: 'record', label: '记一笔' },
  { value: 'fixed', label: '固定支出' },
  { value: 'categories', label: '类目管理' },
  { value: 'credit', label: '信用卡' },
  { value: 'assets', label: '资产' },
]

export default function Finance() {
  const [tab, setTab] = useState('overview')
  const [transactions, setTransactions] = useLocalData('finance_transactions', [])
  const [fixedExpenses, setFixedExpenses] = useLocalData('finance_fixedExpenses', [])
  const [incomeRecords, setIncomeRecords] = useLocalData('finance_incomeRecords', [])
  const [categories, setCategories] = useLocalData('finance_categories', [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...DEFAULT_INCOME_CATEGORIES,
  ])
  const [creditRepayments, setCreditRepayments] = useLocalData('finance_creditRepayments', [])
  const [creditOpeningBalance, setCreditOpeningBalance] = useLocalData('finance_creditOpeningBalance', 0)
  const [assets, setAssets] = useLocalData('finance_assets', {
    cashHolding: 0, bankBalance: 0, sgdCash: 0, sgdBank: 0, otherAssets: [], otherLiabilities: [],
  })
  const { showToast, Toast } = useToast()

  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const incomeCategories = categories.filter((c) => c.type === 'income')

  const credit = computeCreditCard(transactions, creditRepayments, creditOpeningBalance)
  const totalAssets = computeTotalAssets(assets, credit.remaining)
  const monthSummary = computeMonthSummary({ transactions, fixedExpenses, incomeRecords })
  const categoryBreakdown = computeCategoryBreakdown(transactions, 'RM')
  const placeBreakdown = computePlaceBreakdown(transactions, 'RM')
  const sgdCategoryBreakdown = computeCategoryBreakdown(transactions, 'SGD')

  return (
    <div className="px-4 pt-3">
      <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />
      <div className="mt-3">
        {tab === 'overview' && (
          <Overview
            monthSummary={monthSummary}
            totalAssets={totalAssets}
            credit={credit}
            categoryBreakdown={categoryBreakdown}
            placeBreakdown={placeBreakdown}
            sgdCategoryBreakdown={sgdCategoryBreakdown}
          />
        )}
        {tab === 'calendar' && <CalendarTab transactions={transactions} />}
        {tab === 'record' && (
          <RecordTab
            transactions={transactions}
            setTransactions={setTransactions}
            incomeRecords={incomeRecords}
            setIncomeRecords={setIncomeRecords}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            showToast={showToast}
          />
        )}
        {tab === 'fixed' && (
          <FixedTab fixedExpenses={fixedExpenses} setFixedExpenses={setFixedExpenses} />
        )}
        {tab === 'categories' && (
          <CategoriesTab categories={categories} setCategories={setCategories} />
        )}
        {tab === 'credit' && (
          <CreditTab
            credit={credit}
            creditRepayments={creditRepayments}
            setCreditRepayments={setCreditRepayments}
            creditOpeningBalance={creditOpeningBalance}
            setCreditOpeningBalance={setCreditOpeningBalance}
            transactions={transactions}
          />
        )}
        {tab === 'assets' && <AssetsTab assets={assets} setAssets={setAssets} />}
      </div>
      {Toast}
    </div>
  )
}

function StatBox({ label, value, tone = 'default', currency = 'RM' }) {
  const toneCls = tone === 'danger' ? 'text-pink-dark' : 'text-ink'
  return (
    <div className="pixel-corners-sm bg-white border-2 border-ink px-3 py-2">
      <p className="text-xs text-stone2-darker">{label}</p>
      <p className={`font-display text-base ${toneCls}`}>{formatCurrency(value, currency)}</p>
    </div>
  )
}

function Overview({ monthSummary, totalAssets, credit, categoryBreakdown, placeBreakdown, sgdCategoryBreakdown }) {
  return (
    <div className="space-y-3 pb-6">
      <Card className="bg-pink-light">
        <p className="text-xs text-stone2-darker mb-1">本月剩余可支配资金</p>
        <p className={`font-pixel text-xl mb-3 ${monthSummary.remaining < 0 ? 'text-pink-dark' : ''}`}>
          {formatCurrency(monthSummary.remaining, 'RM')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="本月收入" value={monthSummary.monthIncome} />
          <StatBox label="本月个人支出" value={monthSummary.monthExpensePersonal} />
          <StatBox label="固定支出" value={monthSummary.monthFixed} />
          <StatBox label="对公消费(本月)" value={monthSummary.monthPublicTx} />
        </div>
        <p className="text-[11px] text-stone2-darker mt-2">以上均为 RM 计算，不含新币消费</p>
      </Card>

      <Card>
        <SectionTitle>总资产</SectionTitle>
        <p className="font-pixel text-lg mb-2">{formatCurrency(totalAssets.total, 'RM')}</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-stone2-darker">
          <p>现金 {formatCurrency(totalAssets.cash, 'RM')}</p>
          <p>银行存款 {formatCurrency(totalAssets.bank, 'RM')}</p>
          <p>其他资产 {formatCurrency(totalAssets.otherAssets, 'RM')}</p>
          <p>其他负债 -{formatCurrency(totalAssets.otherLiabilities, 'RM')}</p>
        </div>
        {totalAssets.sgdTotal > 0 && (
          <div className="mt-3 pt-3 border-t-2 border-stone2">
            <p className="text-xs text-stone2-darker mb-1">新币资产（单独统计，未换算入 RM）</p>
            <p className="font-display text-base">{formatCurrency(totalAssets.sgdTotal, 'SGD')}</p>
          </div>
        )}
      </Card>

      {(monthSummary.sgdMonthPersonal > 0 || monthSummary.sgdMonthPublic > 0 || sgdCategoryBreakdown.length > 0) && (
        <Card className="bg-mint">
          <SectionTitle>🇸🇬 新加坡消费（本月）</SectionTitle>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <StatBox label="本月个人消费" value={monthSummary.sgdMonthPersonal} currency="SGD" />
            <StatBox label="本月对公消费" value={monthSummary.sgdMonthPublic} currency="SGD" />
          </div>
          {sgdCategoryBreakdown.length > 0 && (
            <div className="space-y-2 mt-2">
              {sgdCategoryBreakdown.map((c) => (
                <div key={c.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{c.category}</span>
                    <span>{formatCurrency(c.amount, 'SGD')} · {c.pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-white pixel-corners-sm">
                    <div className="h-2 bg-mint-dark pixel-corners-sm" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-stone2-darker mt-2">新币消费不并入 RM 预算，单独记录方便对账</p>
        </Card>
      )}

      <Card>
        <SectionTitle>信用卡</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <StatBox label="总负债" value={credit.totalDebt} />
          <StatBox label="已还款" value={credit.repaid} />
          <StatBox label="待还款" value={credit.remaining} tone="danger" />
        </div>
      </Card>

      <Card>
        <SectionTitle>本月消费类目占比</SectionTitle>
        {categoryBreakdown.length === 0 ? (
          <EmptyState emoji="🧾" text="本月还没有个人消费记录" />
        ) : (
          <div className="space-y-2">
            {categoryBreakdown.map((c) => (
              <div key={c.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{c.category}</span>
                  <span>{formatCurrency(c.amount, 'RM')} · {c.pct.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-stone2 pixel-corners-sm">
                  <div className="h-2 bg-pink pixel-corners-sm" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>游玩费用 · 按地点统计</SectionTitle>
        {placeBreakdown.length === 0 ? (
          <EmptyState emoji="🗺️" text="还没有标注地点的游玩记录" />
        ) : (
          <div className="space-y-1.5">
            {placeBreakdown.map((p) => (
              <div key={p.place} className="flex justify-between text-sm">
                <span className="flex items-center gap-1"><MapPin size={14} />{p.place}</span>
                <span>{formatCurrency(p.amount, 'RM')}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}


function CalendarTab({ transactions }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const [selectedDate, setSelectedDate] = useState(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay() // 0=周日
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // 按日期汇总当月每天的花费（RM，含个人+对公）
  const dailyTotals = {}
  const dailySgd = {}
  transactions.forEach((t) => {
    const d = new Date(t.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const dayKey = d.getDate()
      const currency = t.currency || 'RM'
      if (currency === 'RM') {
        dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + Number(t.amount || 0)
      } else {
        dailySgd[dayKey] = (dailySgd[dayKey] || 0) + Number(t.amount || 0)
      }
    }
  })

  const monthTotal = Object.values(dailyTotals).reduce((s, v) => s + v, 0)

  function changeMonth(delta) {
    const d = new Date(cursor)
    d.setMonth(d.getMonth() + delta)
    setCursor(d)
    setSelectedDate(null)
  }

  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(day)

  const selectedDayStr = selectedDate
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`
    : null
  const selectedTx = selectedDayStr
    ? transactions.filter((t) => t.date === selectedDayStr)
    : []

  return (
    <div className="space-y-3 pb-6">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => changeMonth(-1)} className="pixel-corners-sm border-2 border-ink bg-white p-1.5"><ChevronLeft size={16} /></button>
          <p className="font-display text-base">{year} 年 {month + 1} 月</p>
          <button onClick={() => changeMonth(1)} className="pixel-corners-sm border-2 border-ink bg-white p-1.5"><ChevronRight size={16} /></button>
        </div>
        <p className="text-xs text-stone2-darker text-center mb-2">本月总花费（RM）{formatCurrency(monthTotal, 'RM')}</p>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-stone2-darker mb-1">
          {['日', '一', '二', '三', '四', '五', '六'].map((w) => <div key={w}>{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />
            const total = dailyTotals[day]
            const sgd = dailySgd[day]
            const active = selectedDate === day
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(active ? null : day)}
                className={`pixel-corners-sm border-2 border-ink px-0.5 py-1 text-center ${active ? 'bg-pink' : total ? 'bg-pink-light' : 'bg-white'}`}
              >
                <p className="text-xs font-display">{day}</p>
                {total ? <p className="text-[9px] leading-tight">{Math.round(total)}</p> : null}
                {sgd ? <p className="text-[8px] leading-tight text-mint-dark">SGD</p> : null}
              </button>
            )
          })}
        </div>
      </Card>

      {selectedDate && (
        <Card>
          <SectionTitle>{month + 1} 月 {selectedDate} 日的消费</SectionTitle>
          {selectedTx.length === 0 && <EmptyState emoji="🗓️" text="这天没有消费记录" />}
          <div className="space-y-2">
            {selectedTx.map((t) => (
              <div key={t.id} className="flex justify-between text-sm">
                <span>{t.category}{t.place ? ` · ${t.place}` : ''}{t.isPublic ? ' · 对公' : ''}</span>
                <span className="font-display">{formatCurrency(t.amount, t.currency || 'RM')}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}


function RecordTab({
  transactions, setTransactions, incomeRecords, setIncomeRecords,
  expenseCategories, incomeCategories, showToast,
}) {
  const [mode, setMode] = useState('expense')

  const [form, setForm] = useState({
    date: todayStr(), payMethod: 'cash', isPublic: false, currency: 'RM',
    category: expenseCategories[0]?.name || '', place: '', amount: '', note: '',
  })
  const [incomeForm, setIncomeForm] = useState({
    date: todayStr(), category: incomeCategories[0]?.name || '', amount: '', note: '',
  })

  function addExpense() {
    if (!form.amount || Number(form.amount) <= 0) return showToast('请输入有效金额')
    setTransactions([{ id: genId(), ...form, amount: Number(form.amount) }, ...transactions])
    setForm({ ...form, amount: '', note: '', place: '' })
    showToast('已记一笔 ✅')
  }

  function addIncome() {
    if (!incomeForm.amount || Number(incomeForm.amount) <= 0) return showToast('请输入有效金额')
    setIncomeRecords([{ id: genId(), ...incomeForm, amount: Number(incomeForm.amount) }, ...incomeRecords])
    setIncomeForm({ ...incomeForm, amount: '', note: '' })
    showToast('已记录收入 ✅')
  }

  function removeTx(id) {
    setTransactions(transactions.filter((t) => t.id !== id))
  }
  function removeIncome(id) {
    setIncomeRecords(incomeRecords.filter((r) => r.id !== id))
  }

  const [editingTx, setEditingTx] = useState(null)
  const [editingIncome, setEditingIncome] = useState(null)

  function saveTxEdit() {
    if (!editingTx.amount || Number(editingTx.amount) <= 0) return showToast('请输入有效金额')
    setTransactions(transactions.map((t) => (t.id === editingTx.id ? { ...editingTx, amount: Number(editingTx.amount) } : t)))
    setEditingTx(null)
    showToast('已更新 ✅')
  }
  function saveIncomeEdit() {
    if (!editingIncome.amount || Number(editingIncome.amount) <= 0) return showToast('请输入有效金额')
    setIncomeRecords(incomeRecords.map((r) => (r.id === editingIncome.id ? { ...editingIncome, amount: Number(editingIncome.amount) } : r)))
    setEditingIncome(null)
    showToast('已更新 ✅')
  }

  return (
    <div className="space-y-3 pb-6">
      <div className="flex gap-2">
        <Tag active={mode === 'expense'} onClick={() => setMode('expense')} color="pink">支出</Tag>
        <Tag active={mode === 'income'} onClick={() => setMode('income')} color="mint">收入</Tag>
      </div>

      {mode === 'expense' ? (
        <Card>
          <div className="space-y-2.5">
            <Input label="日期" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Select label="消费类目" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {expenseCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </Select>
            {form.category === '游玩费用' && (
              <Input label="游玩地点" placeholder="例如：西湖" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} />
            )}
            <div>
              <span className="block text-xs text-stone2-darker mb-1 font-display">币种</span>
              <div className="flex gap-2">
                {CURRENCIES.map((c) => (
                  <Tag key={c.id} active={form.currency === c.id} onClick={() => setForm({ ...form, currency: c.id })} color="mint">
                    {c.label}
                  </Tag>
                ))}
              </div>
            </div>
            <div>
              <span className="block text-xs text-stone2-darker mb-1 font-display">支付方式</span>
              <div className="flex gap-2">
                {PAY_METHODS.map((p) => (
                  <Tag key={p.id} active={form.payMethod === p.id} onClick={() => setForm({ ...form, payMethod: p.id })}>
                    {p.label}
                  </Tag>
                ))}
              </div>
              {form.currency === 'SGD' && form.payMethod === 'credit' && (
                <p className="text-[11px] text-stone2-darker mt-1">提醒：信用卡负债统计目前只计算 RM 消费</p>
              )}
            </div>
            <div>
              <span className="block text-xs text-stone2-darker mb-1 font-display">消费属性</span>
              <div className="flex gap-2">
                <Tag active={!form.isPublic} onClick={() => setForm({ ...form, isPublic: false })}>个人消费</Tag>
                <Tag active={form.isPublic} onClick={() => setForm({ ...form, isPublic: true })} color="butter">公司采购</Tag>
              </div>
            </div>
            <Input label="金额" type="number" inputMode="decimal" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input label="备注（选填）" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            <Button className="w-full" onClick={addExpense}><Plus size={16} className="inline -mt-0.5 mr-1" />记这一笔</Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="space-y-2.5">
            <Input label="日期" type="date" value={incomeForm.date} onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })} />
            <Select label="收入类目" value={incomeForm.category} onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}>
              {incomeCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </Select>
            <Input label="金额" type="number" inputMode="decimal" placeholder="0.00" value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })} />
            <Input label="备注（选填）" value={incomeForm.note} onChange={(e) => setIncomeForm({ ...incomeForm, note: e.target.value })} />
            <Button variant="mint" className="w-full" onClick={addIncome}><Plus size={16} className="inline -mt-0.5 mr-1" />记录收入</Button>
          </div>
        </Card>
      )}

      <SectionTitle>最近记录</SectionTitle>
      <div className="space-y-2">
        {mode === 'expense' && transactions.slice(0, 30).map((t) => (
          <Card key={t.id} className="flex items-center justify-between py-2.5">
            <div className="min-w-0">
              <p className="font-display text-sm truncate">
                {t.category}{t.place ? ` · ${t.place}` : ''} {t.isPublic && <span className="text-butter bg-ink px-1 text-[10px] align-middle ml-1">对公</span>}
                {(t.currency || 'RM') === 'SGD' && <span className="text-ink bg-mint px-1 text-[10px] align-middle ml-1">SGD</span>}
              </p>
              <p className="text-xs text-stone2-darker">{formatDateLabel(t.date)} · {PAY_METHODS.find((p) => p.id === t.payMethod)?.label}{t.note ? ` · ${t.note}` : ''}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-display">{formatCurrency(t.amount, t.currency || 'RM')}</span>
              <button onClick={() => setEditingTx({ ...t, amount: String(t.amount) })} className="text-stone2-darker"><Pencil size={15} /></button>
              <button onClick={() => removeTx(t.id)} className="text-stone2-darker"><Trash2 size={16} /></button>
            </div>
          </Card>
        ))}
        {mode === 'income' && incomeRecords.slice(0, 30).map((r) => (
          <Card key={r.id} className="flex items-center justify-between py-2.5">
            <div className="min-w-0">
              <p className="font-display text-sm truncate">{r.category}</p>
              <p className="text-xs text-stone2-darker">{formatDateLabel(r.date)}{r.note ? ` · ${r.note}` : ''}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-display">{formatCurrency(r.amount, 'RM')}</span>
              <button onClick={() => setEditingIncome({ ...r, amount: String(r.amount) })} className="text-stone2-darker"><Pencil size={15} /></button>
              <button onClick={() => removeIncome(r.id)} className="text-stone2-darker"><Trash2 size={16} /></button>
            </div>
          </Card>
        ))}
        {(mode === 'expense' ? transactions.length === 0 : incomeRecords.length === 0) && (
          <EmptyState emoji="🧾" text="还没有记录" />
        )}
      </div>

      <Modal open={!!editingTx} onClose={() => setEditingTx(null)} title="编辑这笔支出"
        footer={<Button className="w-full" onClick={saveTxEdit}>保存修改</Button>}>
        {editingTx && (
          <div className="space-y-2.5">
            <Input label="日期" type="date" value={editingTx.date} onChange={(e) => setEditingTx({ ...editingTx, date: e.target.value })} />
            <Select label="消费类目" value={editingTx.category} onChange={(e) => setEditingTx({ ...editingTx, category: e.target.value })}>
              {expenseCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </Select>
            {editingTx.category === '游玩费用' && (
              <Input label="游玩地点" value={editingTx.place || ''} onChange={(e) => setEditingTx({ ...editingTx, place: e.target.value })} />
            )}
            <div>
              <span className="block text-xs text-stone2-darker mb-1 font-display">币种</span>
              <div className="flex gap-2">
                {CURRENCIES.map((c) => (
                  <Tag key={c.id} active={(editingTx.currency || 'RM') === c.id} onClick={() => setEditingTx({ ...editingTx, currency: c.id })} color="mint">
                    {c.label}
                  </Tag>
                ))}
              </div>
            </div>
            <div>
              <span className="block text-xs text-stone2-darker mb-1 font-display">支付方式</span>
              <div className="flex gap-2">
                {PAY_METHODS.map((p) => (
                  <Tag key={p.id} active={editingTx.payMethod === p.id} onClick={() => setEditingTx({ ...editingTx, payMethod: p.id })}>
                    {p.label}
                  </Tag>
                ))}
              </div>
            </div>
            <div>
              <span className="block text-xs text-stone2-darker mb-1 font-display">消费属性</span>
              <div className="flex gap-2">
                <Tag active={!editingTx.isPublic} onClick={() => setEditingTx({ ...editingTx, isPublic: false })}>个人消费</Tag>
                <Tag active={editingTx.isPublic} onClick={() => setEditingTx({ ...editingTx, isPublic: true })} color="butter">公司采购</Tag>
              </div>
            </div>
            <Input label="金额" type="number" inputMode="decimal" value={editingTx.amount} onChange={(e) => setEditingTx({ ...editingTx, amount: e.target.value })} />
            <Input label="备注" value={editingTx.note || ''} onChange={(e) => setEditingTx({ ...editingTx, note: e.target.value })} />
          </div>
        )}
      </Modal>

      <Modal open={!!editingIncome} onClose={() => setEditingIncome(null)} title="编辑这笔收入"
        footer={<Button variant="mint" className="w-full" onClick={saveIncomeEdit}>保存修改</Button>}>
        {editingIncome && (
          <div className="space-y-2.5">
            <Input label="日期" type="date" value={editingIncome.date} onChange={(e) => setEditingIncome({ ...editingIncome, date: e.target.value })} />
            <Select label="收入类目" value={editingIncome.category} onChange={(e) => setEditingIncome({ ...editingIncome, category: e.target.value })}>
              {incomeCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </Select>
            <Input label="金额" type="number" inputMode="decimal" value={editingIncome.amount} onChange={(e) => setEditingIncome({ ...editingIncome, amount: e.target.value })} />
            <Input label="备注" value={editingIncome.note || ''} onChange={(e) => setEditingIncome({ ...editingIncome, note: e.target.value })} />
          </div>
        )}
      </Modal>
    </div>
  )
}

function FixedTab({ fixedExpenses, setFixedExpenses }) {
  const [form, setForm] = useState({ name: '', amount: '', note: '' })
  function add() {
    if (!form.name || !form.amount) return
    setFixedExpenses([{ id: genId(), ...form, amount: Number(form.amount), active: true }, ...fixedExpenses])
    setForm({ name: '', amount: '', note: '' })
  }
  function toggle(id) {
    setFixedExpenses(fixedExpenses.map((f) => (f.id === id ? { ...f, active: !f.active } : f)))
  }
  function remove(id) {
    setFixedExpenses(fixedExpenses.filter((f) => f.id !== id))
  }
  return (
    <div className="space-y-3 pb-6">
      <Card>
        <div className="space-y-2.5">
          <Input label="固定支出名称" placeholder="例如：房租" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="每月金额" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Input label="备注" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <Button className="w-full" onClick={add}><Plus size={16} className="inline -mt-0.5 mr-1" />新增固定支出</Button>
        </div>
      </Card>
      <div className="space-y-2">
        {fixedExpenses.length === 0 && <EmptyState emoji="📌" text="还没有固定支出项" />}
        {fixedExpenses.map((f) => (
          <Card key={f.id} className={`flex items-center justify-between py-2.5 ${!f.active ? 'opacity-50' : ''}`}>
            <div>
              <p className="font-display text-sm">{f.name}</p>
              <p className="text-xs text-stone2-darker">RM {formatMoney(f.amount)}/月{f.note ? ` · ${f.note}` : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant={f.active ? 'mint' : 'secondary'} onClick={() => toggle(f.id)}>
                {f.active ? '生效中' : '已停用'}
              </Button>
              <button onClick={() => remove(f.id)} className="text-stone2-darker"><Trash2 size={16} /></button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CategoriesTab({ categories, setCategories }) {
  const [type, setType] = useState('expense')
  const [name, setName] = useState('')
  const list = categories.filter((c) => c.type === type)

  function add() {
    if (!name.trim()) return
    if (list.some((c) => c.name === name.trim())) return
    setCategories([...categories, { id: genId(), name: name.trim(), type, custom: true }])
    setName('')
  }
  function remove(id) {
    setCategories(categories.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-3 pb-6">
      <div className="flex gap-2">
        <Tag active={type === 'expense'} onClick={() => setType('expense')}>支出类目</Tag>
        <Tag active={type === 'income'} onClick={() => setType('income')} color="mint">收入类目</Tag>
      </div>
      <Card>
        <div className="flex gap-2">
          <Input placeholder="新类目名称" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
          <Button onClick={add}>添加</Button>
        </div>
      </Card>
      <div className="flex flex-wrap gap-2">
        {list.map((c) => (
          <div key={c.id} className="pixel-corners-sm border-2 border-ink bg-white px-3 py-1.5 text-sm flex items-center gap-2">
            {c.name}
            {c.custom && (
              <button onClick={() => remove(c.id)} className="text-stone2-darker"><Trash2 size={14} /></button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CreditTab({ credit, creditRepayments, setCreditRepayments, creditOpeningBalance, setCreditOpeningBalance, transactions }) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayStr())
  const [openingInput, setOpeningInput] = useState(String(creditOpeningBalance || ''))
  const creditTx = transactions.filter((t) => t.payMethod === 'credit').slice(0, 20)

  function addRepay() {
    if (!amount || Number(amount) <= 0) return
    setCreditRepayments([{ id: genId(), date, amount: Number(amount) }, ...creditRepayments])
    setAmount('')
  }
  function remove(id) {
    setCreditRepayments(creditRepayments.filter((r) => r.id !== id))
  }
  function saveOpeningBalance() {
    setCreditOpeningBalance(Number(openingInput) || 0)
  }

  return (
    <div className="space-y-3 pb-6">
      <Card>
        <div className="grid grid-cols-3 gap-2">
          <StatBox label="总负债" value={credit.totalDebt} />
          <StatBox label="已还款" value={credit.repaid} />
          <StatBox label="待还款" value={credit.remaining} tone="danger" />
        </div>
        <p className="text-[11px] text-stone2-darker mt-2">
          总负债 = 期初负债 {formatCurrency(credit.openingBalance, 'RM')} + 之后新记录的信用卡消费 {formatCurrency(credit.txDebt, 'RM')}
        </p>
      </Card>

      <Card className="bg-butter">
        <SectionTitle>期初负债（旧账，一次性录入）</SectionTitle>
        <p className="text-xs text-stone2-darker mb-2">
          用来登记开始用这个 App 之前，信用卡已经欠下的钱。这笔钱不会算进"记一笔"里的月度消费统计，只会加进总负债里。
        </p>
        <div className="flex gap-2">
          <Input type="number" placeholder="例如 4939.85" value={openingInput} onChange={(e) => setOpeningInput(e.target.value)} className="flex-1" />
          <Button size="sm" onClick={saveOpeningBalance}>保存</Button>
        </div>
      </Card>

      <Card>
        <SectionTitle>登记还款</SectionTitle>
        <div className="space-y-2.5">
          <Input label="还款日期" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="还款金额" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Button className="w-full" onClick={addRepay}>确认还款</Button>
        </div>
      </Card>
      <SectionTitle>还款记录</SectionTitle>
      <div className="space-y-2">
        {creditRepayments.length === 0 && <EmptyState emoji="💳" text="还没有还款记录" />}
        {creditRepayments.map((r) => (
          <Card key={r.id} className="flex items-center justify-between py-2.5">
            <p className="text-sm">{formatDateLabel(r.date)}</p>
            <div className="flex items-center gap-2">
              <span className="font-display">{formatCurrency(r.amount, 'RM')}</span>
              <button onClick={() => remove(r.id)} className="text-stone2-darker"><Trash2 size={16} /></button>
            </div>
          </Card>
        ))}
      </div>
      <SectionTitle>信用卡消费明细（记一笔中新增的）</SectionTitle>
      <div className="space-y-2">
        {creditTx.length === 0 && <EmptyState emoji="💳" text="还没有信用卡消费" />}
        {creditTx.map((t) => (
          <Card key={t.id} className="flex items-center justify-between py-2.5">
            <p className="text-sm">{t.category} · {formatDateLabel(t.date)}</p>
            <span className="font-display">{formatCurrency(t.amount, t.currency || 'RM')}</span>
          </Card>
        ))}
      </div>
    </div>
  )
}

function AssetsTab({ assets, setAssets }) {
  const [otherName, setOtherName] = useState('')
  const [otherAmount, setOtherAmount] = useState('')
  const [liabName, setLiabName] = useState('')
  const [liabAmount, setLiabAmount] = useState('')

  function addOtherAsset() {
    if (!otherName || !otherAmount) return
    setAssets({
      ...assets,
      otherAssets: [...(assets.otherAssets || []), { id: genId(), name: otherName, amount: Number(otherAmount) }],
    })
    setOtherName(''); setOtherAmount('')
  }
  function addLiability() {
    if (!liabName || !liabAmount) return
    setAssets({
      ...assets,
      otherLiabilities: [...(assets.otherLiabilities || []), { id: genId(), name: liabName, amount: Number(liabAmount) }],
    })
    setLiabName(''); setLiabAmount('')
  }
  function removeAsset(id) {
    setAssets({ ...assets, otherAssets: assets.otherAssets.filter((a) => a.id !== id) })
  }
  function removeLiability(id) {
    setAssets({ ...assets, otherLiabilities: assets.otherLiabilities.filter((a) => a.id !== id) })
  }

  return (
    <div className="space-y-3 pb-6">
      <Card>
        <SectionTitle>现金 & 银行存款（RM）</SectionTitle>
        <div className="space-y-2.5">
          <Input label="现金持有金额" type="number" value={assets.cashHolding}
            onChange={(e) => setAssets({ ...assets, cashHolding: Number(e.target.value) || 0 })} />
          <Input label="银行存款余额" type="number" value={assets.bankBalance}
            onChange={(e) => setAssets({ ...assets, bankBalance: Number(e.target.value) || 0 })} />
        </div>
      </Card>

      <Card className="bg-mint">
        <SectionTitle>🇸🇬 新币持有</SectionTitle>
        <div className="space-y-2.5">
          <Input label="新币现金" type="number" value={assets.sgdCash ?? 0}
            onChange={(e) => setAssets({ ...assets, sgdCash: Number(e.target.value) || 0 })} />
          <Input label="新币银行存款" type="number" value={assets.sgdBank ?? 0}
            onChange={(e) => setAssets({ ...assets, sgdBank: Number(e.target.value) || 0 })} />
        </div>
        <p className="text-[11px] text-stone2-darker mt-2">新币资产单独统计，不并入 RM 总资产（不做汇率换算）</p>
      </Card>

      <Card>
        <SectionTitle>其他资产</SectionTitle>
        <div className="flex gap-2 mb-3">
          <Input placeholder="名称" value={otherName} onChange={(e) => setOtherName(e.target.value)} className="flex-1" />
          <Input placeholder="金额" type="number" value={otherAmount} onChange={(e) => setOtherAmount(e.target.value)} className="w-24" />
          <Button size="sm" onClick={addOtherAsset}>添加</Button>
        </div>
        <div className="space-y-1.5">
          {(assets.otherAssets || []).map((a) => (
            <div key={a.id} className="flex justify-between text-sm">
              <span>{a.name}</span>
              <span className="flex items-center gap-2">RM {formatMoney(a.amount)}
                <button onClick={() => removeAsset(a.id)} className="text-stone2-darker"><Trash2 size={14} /></button>
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>其他负债（不含信用卡）</SectionTitle>
        <div className="flex gap-2 mb-3">
          <Input placeholder="名称" value={liabName} onChange={(e) => setLiabName(e.target.value)} className="flex-1" />
          <Input placeholder="金额" type="number" value={liabAmount} onChange={(e) => setLiabAmount(e.target.value)} className="w-24" />
          <Button size="sm" variant="danger" onClick={addLiability}>添加</Button>
        </div>
        <div className="space-y-1.5">
          {(assets.otherLiabilities || []).map((a) => (
            <div key={a.id} className="flex justify-between text-sm">
              <span>{a.name}</span>
              <span className="flex items-center gap-2">RM {formatMoney(a.amount)}
                <button onClick={() => removeLiability(a.id)} className="text-stone2-darker"><Trash2 size={14} /></button>
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
