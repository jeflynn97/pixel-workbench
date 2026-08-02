import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useLocalData } from '../../lib/useLocalData.js'
import { Card, Button, Input, Select, Tag, EmptyState } from '../../components/ui.jsx'
import { genId } from '../../lib/utils.js'

const TYPES = ['电视剧', '综艺', '电影']

export default function Watchlist() {
  const [items, setItems] = useLocalData('watchlist', [])
  const [form, setForm] = useState({ title: '', type: '电视剧', note: '' })
  const [filter, setFilter] = useState('all')

  function add() {
    if (!form.title.trim()) return
    setItems([{ id: genId(), ...form, title: form.title.trim(), done: false }, ...items])
    setForm({ title: '', type: '电视剧', note: '' })
  }
  function toggle(id) {
    setItems(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
  }
  function remove(id) {
    setItems(items.filter((i) => i.id !== id))
  }

  const filtered = items
    .filter((i) => filter === 'all' || i.type === filter)
    .sort((a, b) => Number(a.done) - Number(b.done))

  return (
    <div className="px-4 pt-3 space-y-3 pb-6">
      <Card>
        <div className="space-y-2.5">
          <Input label="剧名/片名" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select label="类型" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Input label="备注（推荐人/看点）" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <Button className="w-full" onClick={add}><Plus size={16} className="inline -mt-0.5 mr-1" />加入清单</Button>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <Tag active={filter === 'all'} onClick={() => setFilter('all')}>全部</Tag>
        {TYPES.map((t) => <Tag key={t} active={filter === t} onClick={() => setFilter(t)}>{t}</Tag>)}
      </div>

      {filtered.length === 0 && <EmptyState emoji="🎬" text="清单是空的，添加想看的作品吧" />}
      <div className="space-y-2">
        {filtered.map((i) => (
          <Card key={i.id} className={`flex items-start justify-between py-2.5 ${i.done ? 'opacity-50' : ''}`}>
            <label className="flex items-start gap-2 flex-1 min-w-0">
              <input type="checkbox" checked={i.done} onChange={() => toggle(i.id)} className="w-4 h-4 mt-1 accent-pink-dark" />
              <span className="min-w-0">
                <p className={`font-display text-sm ${i.done ? 'line-through' : ''}`}>{i.title}</p>
                <p className="text-xs text-stone2-darker">{i.type}{i.note ? ` · ${i.note}` : ''}</p>
              </span>
            </label>
            <button onClick={() => remove(i.id)} className="text-stone2-darker shrink-0"><Trash2 size={16} /></button>
          </Card>
        ))}
      </div>
    </div>
  )
}
