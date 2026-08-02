import React, { useState } from 'react'
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { useLocalData } from '../../lib/useLocalData.js'
import { Card, Button, Input, Tag, EmptyState, SectionTitle } from '../../components/ui.jsx'
import { genId, formatDateLabel } from '../../lib/utils.js'

const UNIT_PRESETS = ['个', 'kg', '包', '袋', '盒']

export default function WorkerTasks() {
  const [tasks, setTasks] = useLocalData('workertasks_tasks', [])
  const [categories, setCategories] = useLocalData('workertasks_categories', [])
  const [form, setForm] = useState({ snackName: '', quantity: '', unit: '个' })

  const pending = tasks.filter((t) => t.status === 'pending').sort((a, b) => b.createdAt - a.createdAt)
  const done = tasks.filter((t) => t.status === 'done').sort((a, b) => b.createdAt - a.createdAt)

  function addTask() {
    if (!form.snackName.trim() || !form.quantity) return
    setTasks([{
      id: genId(), snackName: form.snackName.trim(), quantity: form.quantity,
      unit: form.unit, status: 'pending', createdAt: Date.now(),
    }, ...tasks])
    if (!categories.includes(form.snackName.trim())) {
      setCategories([...categories, form.snackName.trim()])
    }
    setForm({ ...form, snackName: '', quantity: '' })
  }

  function toggleStatus(id) {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status: t.status === 'pending' ? 'done' : 'pending' } : t)))
  }
  function remove(id) {
    setTasks(tasks.filter((t) => t.id !== id))
  }
  function removeCategory(name) {
    setCategories(categories.filter((c) => c !== name))
  }

  return (
    <div className="px-4 pt-3 space-y-3 pb-6">
      <Card>
        <SectionTitle>新增制作任务</SectionTitle>
        <div className="space-y-2.5">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Tag key={c} active={form.snackName === c} onClick={() => setForm({ ...form, snackName: c })}>
                  {c}
                </Tag>
              ))}
            </div>
          )}
          <Input label="零食品类" placeholder="例如：鸭胸肉干" value={form.snackName} onChange={(e) => setForm({ ...form, snackName: e.target.value })} />
          <div className="flex gap-2">
            <Input label="制作数量" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="flex-1" />
            <div className="flex-1">
              <span className="block text-xs text-stone2-darker mb-1 font-display">单位</span>
              <div className="flex flex-wrap gap-1.5">
                {UNIT_PRESETS.map((u) => (
                  <Tag key={u} active={form.unit === u} onClick={() => setForm({ ...form, unit: u })} color="mint">{u}</Tag>
                ))}
              </div>
            </div>
          </div>
          <Button className="w-full" onClick={addTask}><Plus size={16} className="inline -mt-0.5 mr-1" />发布任务</Button>
        </div>
      </Card>

      <SectionTitle right={<span className="text-xs font-display">{pending.length} 项待制作</span>}>待制作任务</SectionTitle>
      {pending.length === 0 && <EmptyState emoji="🍪" text="暂无待制作任务，生产已清空" />}
      <div className="space-y-2">
        {pending.map((t) => (
          <Card key={t.id} className="flex items-center justify-between py-2.5 bg-butter">
            <button onClick={() => toggleStatus(t.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
              <Circle size={20} />
              <span className="min-w-0">
                <p className="font-display text-sm">{t.snackName}</p>
                <p className="text-xs text-stone2-darker">{t.quantity}{t.unit} · {formatDateLabel(new Date(t.createdAt).toISOString())}</p>
              </span>
            </button>
            <button onClick={() => remove(t.id)} className="text-stone2-darker shrink-0"><Trash2 size={16} /></button>
          </Card>
        ))}
      </div>

      {done.length > 0 && (
        <details>
          <summary className="text-xs text-stone2-darker font-display cursor-pointer">已完成 {done.length} 项</summary>
          <div className="space-y-2 mt-2">
            {done.map((t) => (
              <Card key={t.id} className="flex items-center justify-between py-2.5 opacity-60">
                <button onClick={() => toggleStatus(t.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                  <CheckCircle2 size={20} />
                  <span className="min-w-0">
                    <p className="font-display text-sm line-through">{t.snackName}</p>
                    <p className="text-xs text-stone2-darker">{t.quantity}{t.unit}</p>
                  </span>
                </button>
                <button onClick={() => remove(t.id)} className="text-stone2-darker shrink-0"><Trash2 size={16} /></button>
              </Card>
            ))}
          </div>
        </details>
      )}

      {categories.length > 0 && (
        <>
          <SectionTitle>常用品类管理</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <div key={c} className="pixel-corners-sm border-2 border-ink bg-white px-3 py-1.5 text-sm flex items-center gap-2">
                {c}
                <button onClick={() => removeCategory(c)} className="text-stone2-darker"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
