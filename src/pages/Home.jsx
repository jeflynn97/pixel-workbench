import React from 'react'
import {
  Wallet, ListChecks, Package, HeartPulse, Clapperboard,
  MapPinned, Dices, BookOpen, ClipboardList, Download, Upload,
} from 'lucide-react'
import { Card } from '../components/ui.jsx'
import { useLocalData } from '../lib/useLocalData.js'
import { computeCreditCard, computeTotalAssets, computeMonthSummary } from '../lib/financeCalc.js'
import { exportAllData, importAllData } from '../lib/storage.js'
import { useToast } from '../components/ui.jsx'
import { useRef, useState } from 'react'

const MODULES = [
  { key: 'finance', name: '全能记账', desc: '收支·资产·信用卡', icon: Wallet, color: 'bg-pink' },
  { key: 'todos', name: '公私待办', desc: '工作与私人事务', icon: ListChecks, color: 'bg-mint' },
  { key: 'inventory', name: '店铺库存', desc: '食材·采购·冻干', icon: Package, color: 'bg-butter' },
  { key: 'life', name: '生活记录', desc: '日记·喝水·运动', icon: HeartPulse, color: 'bg-pink-light' },
  { key: 'watchlist', name: '追剧清单', desc: '剧集·综艺·电影', icon: Clapperboard, color: 'bg-mint' },
  { key: 'foodmap', name: '美食地图', desc: '打卡·探店记录', icon: MapPinned, color: 'bg-butter' },
  { key: 'randompicker', name: '随机点餐', desc: '选择困难救星', icon: Dices, color: 'bg-pink' },
  { key: 'recipes', name: '食谱管理', desc: '库存·收藏食谱', icon: BookOpen, color: 'bg-mint' },
  { key: 'workertasks', name: '生产任务', desc: '工人零食制作看板', icon: ClipboardList, color: 'bg-butter' },
]

export default function Home({ onNavigate }) {
  const [transactions] = useLocalData('finance_transactions', [])
  const [fixedExpenses] = useLocalData('finance_fixedExpenses', [])
  const [incomeRecords] = useLocalData('finance_incomeRecords', [])
  const [creditRepayments] = useLocalData('finance_creditRepayments', [])
  const [creditOpeningBalance] = useLocalData('finance_creditOpeningBalance', 0)
  const [assets] = useLocalData('finance_assets', { cashHolding: 0, bankBalance: 0, sgdCash: 0, sgdBank: 0, otherAssets: [], otherLiabilities: [] })

  const credit = computeCreditCard(transactions, creditRepayments, creditOpeningBalance)
  const totalAssets = computeTotalAssets(assets, credit.remaining)
  const monthSummary = computeMonthSummary({ transactions, fixedExpenses, incomeRecords })

  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const { showToast, Toast } = useToast()

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const res = await importAllData(file)
      showToast(`导入成功，已还原 ${res.restoredCount} 项数据，正在刷新…`)
      setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      showToast('导入失败：文件格式不正确')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-4 pt-4 pb-24 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-pixel text-[10px] text-stone2-darker mb-1">PIXEL WORKBENCH</p>
          <h1 className="font-display text-2xl">绚绚工作台 🏠</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { exportAllData(); showToast('已导出备份文件 ✅') }}
            className="pixel-corners-sm border-2 border-ink bg-white p-2 shadow-pixel-sm active:translate-x-[1px] active:translate-y-[1px]"
            title="导出全部数据"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="pixel-corners-sm border-2 border-ink bg-white p-2 shadow-pixel-sm active:translate-x-[1px] active:translate-y-[1px]"
            title="导入数据"
          >
            <Upload size={18} />
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      <Card className="mb-4 bg-pink-light">
        <p className="font-display text-xs text-stone2-darker mb-1">本月剩余可支配资金</p>
        <p className={`font-pixel text-xl mb-3 ${monthSummary.remaining < 0 ? 'text-pink-dark' : 'text-ink'}`}>
          RM {monthSummary.remaining.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="pixel-corners-sm bg-white border-2 border-ink px-3 py-2">
            <p className="text-xs text-stone2-darker">个人总资产</p>
            <p className="font-display text-base">RM {totalAssets.total.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="pixel-corners-sm bg-white border-2 border-ink px-3 py-2">
            <p className="text-xs text-stone2-darker">信用卡待还</p>
            <p className="font-display text-base">RM {credit.remaining.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        {totalAssets.sgdTotal > 0 && (
          <p className="text-xs text-stone2-darker mt-2">🇸🇬 新币资产 SGD {totalAssets.sgdTotal.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</p>
        )}
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {MODULES.map((m) => (
          <button key={m.key} onClick={() => onNavigate(m.key)} className="text-left">
            <Card className={`h-full ${m.color} active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}>
              <m.icon size={26} strokeWidth={2} className="mb-2" />
              <p className="font-display text-base leading-tight">{m.name}</p>
              <p className="text-xs text-stone2-darker mt-0.5">{m.desc}</p>
            </Card>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-stone2-darker mt-6 font-display">
        所有数据保存在本机浏览器 · 记得定期导出备份 🌱
      </p>
      {Toast}
    </div>
  )
}
