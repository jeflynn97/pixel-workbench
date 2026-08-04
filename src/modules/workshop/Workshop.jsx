import React, { useState } from 'react'
import { Plus, Trash2, Minus, Snowflake, CheckCircle2, Circle, Pencil } from 'lucide-react'
import { useLocalData } from '../../lib/useLocalData.js'
import {
  Card, Button, Input, SegmentedTabs, SectionTitle, EmptyState, Tag, Modal,
} from '../../components/ui.jsx'
import { genId, todayStr, formatMoney, formatDateLabel } from '../../lib/utils.js'
import { DEFAULT_INGREDIENTS } from '../../lib/seed.js'

const TABS = [
  { value: 'ingredients', label: '食材库存' },
  { value: 'shopping', label: '采购清单' },
  { value: 'frozen', label: '冻干库存' },
  { value: 'tasks', label: '生产任务' },
]

export default function Workshop() {
  const [tab, setTab] = useState('ingredients')
  return (
    <div className="px-4 pt-3">
      <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />
      <div className="mt-3">
        {tab === 'ingredients' && <IngredientsTab />}
        {tab === 'shopping' && <ShoppingTab />}
        {tab === 'frozen' && <FrozenTab />}
        {tab === 'tasks' && <TasksTab />}
      </div>
    </div>
  )
}

function IngredientsTab() {
  const [items, setItems] = useLocalData('inventory_ingredients', DEFAULT_INGREDIENTS)
  const [name, setName] = useState('')

  function addItem() {
    if (!name.trim()) return
    setItems([...items, { id: genId(), name: name.trim(), packs: 0, custom: true }])
    setName('')
  }
  function changePacks(id, delta) {
    setItems(items.map((i) => (i.id === id ? { ...i, packs: Math.max(0, i.packs + delta) } : i)))
  }
  function setPacks(id, val) {
    setItems(items.map((i) => (i.id === id ? { ...i, packs: Math.max(0, Number(val) || 0) } : i)))
  }
  function remove(id) {
    setItems(items.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-3 pb-6">
      <Card>
        <div className="flex gap-2">
          <Input placeholder="新增食材品类" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
          <Button onClick={addItem}><Plus size={16} /></Button>
        </div>
      </Card>
      <div className="space-y-2">
        {items.map((i) => (
          <Card key={i.id} className="flex items-center justify-between py-2.5">
            <p className="font-display text-sm flex-1">{i.name}</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => changePacks(i.id, -1)} className="pixel-corners-sm border-2 border-ink bg-white p-1"><Minus size={14} /></button>
              <input
                type="number"
                value={i.packs}
                onChange={(e) => setPacks(i.id, e.target.value)}
                className="w-14 text-center pixel-corners-sm border-2 border-ink py-1 text-sm"
              />
              <button onClick={() => changePacks(i.id, 1)} className="pixel-corners-sm border-2 border-ink bg-white p-1"><Plus size={14} /></button>
              <span className="text-xs text-stone2-darker">包</span>
              {i.custom && <button onClick={() => remove(i.id)} className="text-stone2-darker ml-1"><Trash2 size={16} /></button>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ShoppingTab() {
  const [list, setList] = useLocalData('inventory_shoppingList', [])
  const [name, setName] = useState('')

  function addItem() {
    if (!name.trim()) return
    setList([{ id: genId(), name: name.trim(), done: false, prices: [] }, ...list])
    setName('')
  }
  function remove(id) {
    setList(list.filter((i) => i.id !== id))
  }
  function toggleDone(id) {
    setList(list.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
  }
  function addPrice(id, store, price) {
    if (!store || !price) return
    setList(list.map((i) => (i.id === id
      ? { ...i, prices: [{ id: genId(), store, price: Number(price), date: todayStr() }, ...i.prices] }
      : i)))
  }
  function removePrice(itemId, priceId) {
    setList(list.map((i) => (i.id === itemId ? { ...i, prices: i.prices.filter((p) => p.id !== priceId) } : i)))
  }

  return (
    <div className="space-y-3 pb-6">
      <Card>
        <div className="flex gap-2">
          <Input placeholder="需要采购的物品" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
          <Button onClick={addItem}><Plus size={16} /></Button>
        </div>
      </Card>
      {list.length === 0 && <EmptyState emoji="🛒" text="采购清单是空的" />}
      <div className="space-y-3">
        {list.map((item) => (
          <ShoppingItem key={item.id} item={item} onRemove={remove} onToggleDone={toggleDone} onAddPrice={addPrice} onRemovePrice={removePrice} />
        ))}
      </div>
    </div>
  )
}

function ShoppingItem({ item, onRemove, onToggleDone, onAddPrice, onRemovePrice }) {
  const [store, setStore] = useState('')
  const [price, setPrice] = useState('')
  const cheapest = item.prices.length > 0 ? Math.min(...item.prices.map((p) => p.price)) : null

  return (
    <Card>
      <div className="flex items-start justify-between mb-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={item.done} onChange={() => onToggleDone(item.id)} className="w-4 h-4 accent-pink-dark" />
          <span className={`font-display ${item.done ? 'line-through text-stone2-darker' : ''}`}>{item.name}</span>
        </label>
        <button onClick={() => onRemove(item.id)} className="text-stone2-darker"><Trash2 size={16} /></button>
      </div>
      <div className="flex gap-2 mb-2">
        <Input placeholder="商家" value={store} onChange={(e) => setStore(e.target.value)} className="flex-1" />
        <Input placeholder="单价" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-20" />
        <Button size="sm" onClick={() => { onAddPrice(item.id, store, price); setStore(''); setPrice('') }}>记录</Button>
      </div>
      {item.prices.length > 0 && (
        <div className="space-y-1">
          {item.prices.map((p) => (
            <div key={p.id} className={`flex justify-between text-xs px-2 py-1 pixel-corners-sm ${p.price === cheapest ? 'bg-mint' : 'bg-cream'}`}>
              <span>{p.store}{p.price === cheapest && ' · 最低价'}</span>
              <span className="flex items-center gap-2">
                RM {formatMoney(p.price)}
                <button onClick={() => onRemovePrice(item.id, p.id)} className="text-stone2-darker"><Trash2 size={12} /></button>
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function FrozenTab() {
  const [items, setItems] = useLocalData('inventory_frozen', [])
  const [form, setForm] = useState({ name: '', weightSpec: '', packs: '' })

  function add() {
    if (!form.name || !form.weightSpec) return
    setItems([{ id: genId(), name: form.name, weightSpec: form.weightSpec, packs: Number(form.packs) || 0 }, ...items])
    setForm({ name: '', weightSpec: '', packs: '' })
  }
  function changePacks(id, delta) {
    setItems(items.map((i) => (i.id === id ? { ...i, packs: Math.max(0, i.packs + delta) } : i)))
  }
  function remove(id) {
    setItems(items.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-3 pb-6">
      <Card>
        <SectionTitle><span className="flex items-center gap-1.5"><Snowflake size={18} />新增冻干规格</span></SectionTitle>
        <div className="space-y-2.5">
          <Input label="品名" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="规格（克重）" placeholder="例如：500g" value={form.weightSpec} onChange={(e) => setForm({ ...form, weightSpec: e.target.value })} />
          <Input label="初始包数" type="number" value={form.packs} onChange={(e) => setForm({ ...form, packs: e.target.value })} />
          <Button className="w-full" onClick={add}><Plus size={16} className="inline -mt-0.5 mr-1" />添加</Button>
        </div>
      </Card>
      {items.length === 0 && <EmptyState emoji="❄️" text="还没有冻干库存记录" />}
      <div className="space-y-2">
        {items.map((i) => (
          <Card key={i.id} className="flex items-center justify-between py-2.5 bg-butter">
            <div>
              <p className="font-display text-sm">{i.name}</p>
              <p className="text-xs text-stone2-darker">规格 {i.weightSpec}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => changePacks(i.id, -1)} className="pixel-corners-sm border-2 border-ink bg-white p-1"><Minus size={14} /></button>
              <span className="w-10 text-center text-sm">{i.packs}包</span>
              <button onClick={() => changePacks(i.id, 1)} className="pixel-corners-sm border-2 border-ink bg-white p-1"><Plus size={14} /></button>
              <button onClick={() => remove(i.id)} className="text-stone2-darker ml-1"><Trash2 size={16} /></button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

const UNIT_PRESETS = ['个', 'kg', '包', '袋', '盒']

function TasksTab() {
  const [tasks, setTasks] = useLocalData('workertasks_tasks', [])
  const [categories, setCategories] = useLocalData('workertasks_categories', [])
  const [form, setForm] = useState({ snackName: '', quantity: '', unit: '个' })
  const [editing, setEditing] = useState(null)

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
  function saveEdit() {
    if (!editing.snackName.trim() || !editing.quantity) return
    setTasks(tasks.map((t) => (t.id === editing.id ? { ...editing, snackName: editing.snackName.trim() } : t)))
    setEditing(null)
  }

  return (
    <div className="space-y-3 pb-6">
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
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setEditing({ ...t })} className="text-stone2-darker"><Pencil size={16} /></button>
              <button onClick={() => remove(t.id)} className="text-stone2-darker"><Trash2 size={16} /></button>
            </div>
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
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setEditing({ ...t })} className="text-stone2-darker"><Pencil size={16} /></button>
                  <button onClick={() => remove(t.id)} className="text-stone2-darker"><Trash2 size={16} /></button>
                </div>
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

      <Modal open={!!editing} onClose={() => setEditing(null)} title="编辑任务"
        footer={<Button className="w-full" onClick={saveEdit}>保存修改</Button>}>
        {editing && (
          <div className="space-y-2.5">
            <Input label="零食品类" value={editing.snackName} onChange={(e) => setEditing({ ...editing, snackName: e.target.value })} />
            <div className="flex gap-2">
              <Input label="制作数量" type="number" value={editing.quantity} onChange={(e) => setEditing({ ...editing, quantity: e.target.value })} className="flex-1" />
              <div className="flex-1">
                <span className="block text-xs text-stone2-darker mb-1 font-display">单位</span>
                <div className="flex flex-wrap gap-1.5">
                  {UNIT_PRESETS.map((u) => (
                    <Tag key={u} active={editing.unit === u} onClick={() => setEditing({ ...editing, unit: u })} color="mint">{u}</Tag>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
