import React, { useState } from 'react'
import { Plus, Trash2, Minus, Snowflake } from 'lucide-react'
import { useLocalData } from '../../lib/useLocalData.js'
import {
  Card, Button, Input, SegmentedTabs, SectionTitle, EmptyState,
} from '../../components/ui.jsx'
import { genId, todayStr, formatMoney } from '../../lib/utils.js'
import { DEFAULT_INGREDIENTS } from '../../lib/seed.js'

const TABS = [
  { value: 'ingredients', label: '食材库存' },
  { value: 'shopping', label: '采购清单' },
  { value: 'frozen', label: '冻干库存' },
]

export default function Inventory() {
  const [tab, setTab] = useState('ingredients')
  return (
    <div className="px-4 pt-3">
      <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />
      <div className="mt-3">
        {tab === 'ingredients' && <IngredientsTab />}
        {tab === 'shopping' && <ShoppingTab />}
        {tab === 'frozen' && <FrozenTab />}
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
                ¥{formatMoney(p.price)}
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
