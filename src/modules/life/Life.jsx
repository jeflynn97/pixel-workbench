import React, { useState } from 'react'
import { Plus, Minus, Droplet, Dumbbell, Sparkles, BookHeart } from 'lucide-react'
import { useLocalData } from '../../lib/useLocalData.js'
import { Card, Button, Input, Textarea, SectionTitle, EmptyState } from '../../components/ui.jsx'
import { todayStr, formatDateLabel } from '../../lib/utils.js'

const emptyDay = () => ({ diary: '', water: 0, exercise: '', skincare: false })

export default function Life() {
  const [logs, setLogs] = useLocalData('life_logs', {})
  const [date, setDate] = useState(todayStr())
  const day = logs[date] || emptyDay()

  function updateDay(patch) {
    setLogs({ ...logs, [date]: { ...day, ...patch } })
  }

  const historyDates = Object.keys(logs)
    .filter((d) => logs[d].diary || logs[d].water > 0 || logs[d].exercise || logs[d].skincare)
    .sort((a, b) => (a < b ? 1 : -1))
    .slice(0, 14)

  return (
    <div className="px-4 pt-3 space-y-3 pb-6">
      <Card>
        <Input label="选择日期" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <p className="text-xs text-stone2-darker mt-1">{formatDateLabel(date)}</p>
      </Card>

      <Card className="bg-pink-light">
        <SectionTitle><span className="flex items-center gap-1.5"><Droplet size={18} />喝水打卡</span></SectionTitle>
        <div className="flex items-center gap-3">
          <button onClick={() => updateDay({ water: Math.max(0, day.water - 1) })} className="pixel-corners-sm border-2 border-ink bg-white p-2"><Minus size={16} /></button>
          <span className="font-pixel text-lg flex-1 text-center">{day.water} 杯</span>
          <button onClick={() => updateDay({ water: day.water + 1 })} className="pixel-corners-sm border-2 border-ink bg-white p-2"><Plus size={16} /></button>
        </div>
      </Card>

      <Card className="bg-mint">
        <SectionTitle><span className="flex items-center gap-1.5"><Dumbbell size={18} />运动记录</span></SectionTitle>
        <Input placeholder="例如：跑步30分钟 / 瑜伽" value={day.exercise} onChange={(e) => updateDay({ exercise: e.target.value })} />
      </Card>

      <Card className="bg-butter">
        <SectionTitle right={
          <button
            onClick={() => updateDay({ skincare: !day.skincare })}
            className={`pixel-corners-sm border-2 border-ink px-3 py-1 text-xs font-display ${day.skincare ? 'bg-pink' : 'bg-white'}`}
          >
            {day.skincare ? '今日已打卡 ✓' : '点击打卡'}
          </button>
        }>
          <span className="flex items-center gap-1.5"><Sparkles size={18} />护肤打卡</span>
        </SectionTitle>
      </Card>

      <Card>
        <SectionTitle><span className="flex items-center gap-1.5"><BookHeart size={18} />今日日记</span></SectionTitle>
        <Textarea rows={5} placeholder="今天发生了什么呀…" value={day.diary} onChange={(e) => updateDay({ diary: e.target.value })} />
      </Card>

      <SectionTitle>历史记录</SectionTitle>
      {historyDates.length === 0 && <EmptyState emoji="🗓️" text="还没有历史记录" />}
      <div className="space-y-2">
        {historyDates.map((d) => (
          <Card key={d} className="cursor-pointer" onClick={() => setDate(d)}>
            <p className="font-display text-sm mb-1">{formatDateLabel(d)}</p>
            <p className="text-xs text-stone2-darker">
              💧{logs[d].water}杯 {logs[d].exercise && `· 🏃${logs[d].exercise}`} {logs[d].skincare && '· ✨护肤'}
            </p>
            {logs[d].diary && <p className="text-xs text-ink mt-1 line-clamp-2">{logs[d].diary}</p>}
          </Card>
        ))}
      </div>
    </div>
  )
}
