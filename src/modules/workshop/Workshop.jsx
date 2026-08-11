import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Minus, Snowflake, CheckCircle2, Circle, Pencil, ChevronUp, ChevronDown } from 'lucide-react'
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
  const [buyList, setBuyList] = useLocalData('inventory_shoppingList', [])
  const [priceBook, setPriceBook] = useLocalData('inventory_priceBook', [])
  const [migrated, setMigrated] = useState(false)
  const [subTab, setSubTab] = useState('buy')

  // 一次性数据迁移：把旧版"采购清单"里绑定在每个物品上的价格记录，搬到独立的比价记录本
  // 这样以后清空/删除采购清单里的物品，不会再连带把价格记录也删掉
  useEffect(() => {
    if (migrated) return
    const hasOldPrices = buyList.some((i) => Array.isArray(i.prices) && i.prices.length > 0)
    if (hasOldPrices && priceBook.length === 0) {
      const newPriceBook = []
      buyList.forEach((item) => {
        if (item.prices && item.prices.length > 0) {
          newPriceBook.push({ id: genId(), name: item.name, prices: item.prices })
        }
      })
      setPriceBook(newPriceBook)
      setBuyList(buyList.map(({ prices, ...rest }) => rest))
    }
    setMigrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-3 pb-6">
      <SegmentedTabs
        tabs={[{ value: 'buy', label: '本次要买' }, { value: 'pricebook', label: '比价记录本' }]}
        value={subTab}
        onChange={setSubTab}
      />
      {subTab === 'buy' ? (
        <BuyListSection buyList={buyList} setBuyList={setBuyList} priceBook={priceBook} setPriceBook={setPriceBook} />
      ) : (
        <PriceBookSection priceBook={priceBook} setPriceBook={setPriceBook} />
      )}
    </div>
  )
}

function BuyListSection({ buyList, setBuyList, priceBook, setPriceBook }) {
  const [name, setName] = useState('')
  const pending = buyList.filter((i) => !i.done)
  const done = buyList.filter((i) => i.done)

  function addItem(itemName) {
    const finalName = (itemName ?? name).trim()
    if (!finalName) return
    setBuyList([{ id: genId(), name: finalName, done: false }, ...buyList])
    if (!itemName) setName('')
  }
  function remove(id) {
    setBuyList(buyList.filter((i) => i.id !== id))
  }
  function toggleDone(id) {
    setBuyList(buyList.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
  }
  function clearDone() {
    setBuyList(buyList.filter((i) => !i.done))
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex gap-2">
          <Input
            placeholder="需要采购的物品"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            className="flex-1"
          />
          <Button onClick={() => addItem()}><Plus size={16} /></Button>
        </div>
        {priceBook.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[11px] text-stone2-darker w-full">从比价记录本快速添加：</span>
            {priceBook.map((p) => (
              <Tag key={p.id} onClick={() => addItem(p.name)} color="mint">{p.name}</Tag>
            ))}
          </div>
        )}
      </Card>

      {buyList.length === 0 && <EmptyState emoji="🛒" text="采购清单是空的" />}

      <div className="space-y-2">
        {pending.map((item) => (
          <Card key={item.id} className="flex items-center justify-between py-2.5">
            <label className="flex items-center gap-2 flex-1 min-w-0">
              <input type="checkbox" checked={item.done} onChange={() => toggleDone(item.id)} className="w-4 h-4 accent-pink-dark" />
              <span className="font-display">{item.name}</span>
            </label>
            <button onClick={() => remove(item.id)} className="text-stone2-darker shrink-0"><Trash2 size={16} /></button>
          </Card>
        ))}
      </div>

      {done.length > 0 && (
        <details>
          <summary className="text-xs text-stone2-darker font-display cursor-pointer">已买 {done.length} 项</summary>
          <div className="space-y-2 mt-2">
            {done.map((item) => (
              <Card key={item.id} className="flex items-center justify-between py-2.5 opacity-60">
                <label className="flex items-center gap-2 flex-1 min-w-0">
                  <input type="checkbox" checked={item.done} onChange={() => toggleDone(item.id)} className="w-4 h-4 accent-pink-dark" />
                  <span className="font-display line-through">{item.name}</span>
                </label>
                <button onClick={() => remove(item.id)} className="text-stone2-darker shrink-0"><Trash2 size={16} /></button>
              </Card>
            ))}
          </div>
          <Button size="sm" variant="secondary" className="mt-2" onClick={clearDone}>清空已买项目</Button>
        </details>
      )}
    </div>
  )
}

const UNIT_PRESETS_SHOPPING = ['/kg', '粒', '包', '根', '打', '个', '箱']

function PriceBookSection({ priceBook, setPriceBook }) {
  const [name, setName] = useState('')

  function addBookItem() {
    if (!name.trim()) return
    if (priceBook.some((p) => p.name === name.trim())) return
    setPriceBook([{ id: genId(), name: name.trim(), prices: [] }, ...priceBook])
    setName('')
  }
  function removeBookItem(id) {
    setPriceBook(priceBook.filter((p) => p.id !== id))
  }
  function addPrice(id, store, price, unit) {
    if (!store || !price) return
    setPriceBook(priceBook.map((i) => (i.id === id
      ? { ...i, prices: [{ id: genId(), store, price: Number(price), unit: unit || '', date: todayStr() }, ...i.prices] }
      : i)))
  }
  function removePrice(itemId, priceId) {
    setPriceBook(priceBook.map((i) => (i.id === itemId ? { ...i, prices: i.prices.filter((p) => p.id !== priceId) } : i)))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone2-darker">
        永久保存的比价档案，跟"本次要买"清单是分开的——买了、勾了、清掉清单都不会影响这里的价格记录。
      </p>
      <Card>
        <div className="flex gap-2">
          <Input placeholder="新增要比价的食材/物品" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addBookItem()} className="flex-1" />
          <Button onClick={addBookItem}><Plus size={16} /></Button>
        </div>
      </Card>
      {priceBook.length === 0 && <EmptyState emoji="📊" text="还没有比价记录" />}
      <div className="space-y-3">
        {priceBook.map((item) => (
          <PriceBookItem key={item.id} item={item} onRemoveItem={removeBookItem} onAddPrice={addPrice} onRemovePrice={removePrice} />
        ))}
      </div>
    </div>
  )
}

function PriceBookItem({ item, onRemoveItem, onAddPrice, onRemovePrice }) {
  const [store, setStore] = useState('')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('')

  // 按单位分组比价：不同单位（比如 /kg 和 5粒）之间不直接比较，只在同单位内找最低价
  const cheapestByUnit = {}
  item.prices.forEach((p) => {
    const key = p.unit || '（未填单位）'
    if (cheapestByUnit[key] === undefined || p.price < cheapestByUnit[key]) {
      cheapestByUnit[key] = p.price
    }
  })

  return (
    <Card>
      <div className="flex items-start justify-between mb-2">
        <span className="font-display">{item.name}</span>
        <button onClick={() => onRemoveItem(item.id)} className="text-stone2-darker"><Trash2 size={16} /></button>
      </div>
      <div className="flex gap-2 mb-1.5">
        <Input placeholder="商家" value={store} onChange={(e) => setStore(e.target.value)} className="flex-1" />
        <Input placeholder="单价" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-20" />
      </div>
      <div className="flex gap-2 mb-2">
        <Input placeholder="单位，例如 /kg、5粒" value={unit} onChange={(e) => setUnit(e.target.value)} className="flex-1" />
        <Button size="sm" onClick={() => { onAddPrice(item.id, store, price, unit); setStore(''); setPrice(''); setUnit('') }}>记录</Button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {UNIT_PRESETS_SHOPPING.map((u) => (
          <Tag key={u} active={unit === u} onClick={() => setUnit(u)} color="mint">{u}</Tag>
        ))}
      </div>
      {item.prices.length > 0 && (
        <div className="space-y-1">
          {item.prices.map((p) => {
            const key = p.unit || '（未填单位）'
            const isCheapest = p.price === cheapestByUnit[key]
            return (
              <div key={p.id} className={`flex justify-between text-xs px-2 py-1 pixel-corners-sm ${isCheapest ? 'bg-mint' : 'bg-cream'}`}>
                <span>{p.store}{p.unit ? ` · ${p.unit}` : ''}{isCheapest && ' · 该单位最低价'}</span>
                <span className="flex items-center gap-2">
                  RM {formatMoney(p.price)}
                  <button onClick={() => onRemovePrice(item.id, p.id)} className="text-stone2-darker"><Trash2 size={12} /></button>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
// 把可能还是旧格式（{name, weightSpec, packs} 平铺一行）的数据，
// 归一化成新格式（{name, specs:[{weightSpec, packs}]}）。
// 这个函数在渲染时同步调用，不管数据是新是旧、甚至新旧混杂，都能直接安全渲染，不会有"崩溃空白"的窗口期。
function normalizeFrozenItems(items) {
  const grouped = {}
  const order = []
  items.forEach((i) => {
    if (!grouped[i.name]) {
      grouped[i.name] = { id: i.id || genId(), name: i.name, specs: [] }
      order.push(i.name)
    }
    if (Array.isArray(i.specs)) {
      grouped[i.name].specs.push(...i.specs)
    } else if (i.weightSpec !== undefined) {
      grouped[i.name].specs.push({ id: genId(), weightSpec: i.weightSpec, packs: i.packs || 0 })
    }
  })
  return order.map((n) => grouped[n])
}

function FrozenTab() {
  const [items, setItems] = useLocalData('inventory_frozen', [])
  const [form, setForm] = useState({ name: '', weightSpec: '', packs: '' })

  // 每次渲染都先归一化一遍再用，保证界面永远拿到的是安全的新格式数据
  const normalizedItems = normalizeFrozenItems(items)

  // 如果检测到存储里还是旧格式，顺手把归一化后的结果写回存储，之后就不用每次都转换了
  useEffect(() => {
    const hasOldFormat = items.some((i) => i.weightSpec !== undefined && !Array.isArray(i.specs))
    if (hasOldFormat) {
      setItems(normalizedItems)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const productNames = normalizedItems.map((i) => i.name)

  function add() {
    if (!form.name.trim() || !form.weightSpec.trim()) return
    const trimmedName = form.name.trim()
    const existing = normalizedItems.find((i) => i.name === trimmedName)
    if (existing) {
      // 同名品类已存在：把这个规格加进去，而不是新建一张卡片
      setItems(normalizedItems.map((i) => (i.id === existing.id
        ? { ...i, specs: [...i.specs, { id: genId(), weightSpec: form.weightSpec.trim(), packs: Number(form.packs) || 0 }] }
        : i)))
    } else {
      setItems([{ id: genId(), name: trimmedName, specs: [{ id: genId(), weightSpec: form.weightSpec.trim(), packs: Number(form.packs) || 0 }] }, ...normalizedItems])
    }
    setForm({ name: form.name, weightSpec: '', packs: '' })
  }
  function changePacks(productId, specId, delta) {
    setItems(normalizedItems.map((i) => (i.id === productId
      ? { ...i, specs: i.specs.map((s) => (s.id === specId ? { ...s, packs: Math.max(0, s.packs + delta) } : s)) }
      : i)))
  }
  function removeSpec(productId, specId) {
    setItems(normalizedItems.map((i) => (i.id === productId ? { ...i, specs: i.specs.filter((s) => s.id !== specId) } : i)))
  }
  function removeProduct(productId) {
    setItems(normalizedItems.filter((i) => i.id !== productId))
  }

  return (
    <div className="space-y-3 pb-6">
      <Card>
        <SectionTitle><span className="flex items-center gap-1.5"><Snowflake size={18} />新增冻干规格</span></SectionTitle>
        <div className="space-y-2.5">
          <Input label="品名" placeholder="例如：冻干虾" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {productNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {productNames.map((n) => (
                <Tag key={n} active={form.name === n} onClick={() => setForm({ ...form, name: n })} color="mint">{n}</Tag>
              ))}
            </div>
          )}
          <Input label="规格（克重）" placeholder="例如：250g" value={form.weightSpec} onChange={(e) => setForm({ ...form, weightSpec: e.target.value })} />
          <Input label="初始包数" type="number" value={form.packs} onChange={(e) => setForm({ ...form, packs: e.target.value })} />
          <Button className="w-full" onClick={add}><Plus size={16} className="inline -mt-0.5 mr-1" />添加</Button>
          <p className="text-[11px] text-stone2-darker">品名跟已有品类一样的话，会自动把这个规格加进同一张卡片，不会重复建卡</p>
        </div>
      </Card>
      {normalizedItems.length === 0 && <EmptyState emoji="❄️" text="还没有冻干库存记录" />}
      <div className="space-y-2">
        {normalizedItems.map((product) => (
          <Card key={product.id} className="bg-butter">
            <div className="flex items-center justify-between mb-2">
              <p className="font-display text-sm">{product.name}</p>
              <button onClick={() => removeProduct(product.id)} className="text-stone2-darker"><Trash2 size={16} /></button>
            </div>
            <div className="space-y-1.5">
              {(product.specs || []).map((s) => (
                <div key={s.id} className="flex items-center justify-between bg-white pixel-corners-sm border-2 border-ink px-2.5 py-1.5">
                  <span className="text-sm">规格 {s.weightSpec}</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => changePacks(product.id, s.id, -1)} className="pixel-corners-sm border-2 border-ink bg-white p-1"><Minus size={13} /></button>
                    <span className="w-9 text-center text-sm">{s.packs}包</span>
                    <button onClick={() => changePacks(product.id, s.id, 1)} className="pixel-corners-sm border-2 border-ink bg-white p-1"><Plus size={13} /></button>
                    <button onClick={() => removeSpec(product.id, s.id)} className="text-stone2-darker ml-1"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              {(!product.specs || product.specs.length === 0) && <p className="text-xs text-stone2-darker">还没有规格，在上面表单里给它加一个吧</p>}
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

  const pending = tasks.filter((t) => t.status === 'pending').sort((a, b) => a.createdAt - b.createdAt)
  const done = tasks.filter((t) => t.status === 'done').sort((a, b) => b.createdAt - a.createdAt)

  function moveTask(id, direction) {
    const idx = pending.findIndex((t) => t.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= pending.length) return
    const a = pending[idx]
    const b = pending[swapIdx]
    setTasks(tasks.map((t) => {
      if (t.id === a.id) return { ...t, createdAt: b.createdAt }
      if (t.id === b.id) return { ...t, createdAt: a.createdAt }
      return t
    }))
  }

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
      <p className="text-[11px] text-stone2-darker -mt-2">用右侧箭头调整制作顺序，从上到下就是制作先后</p>
      {pending.length === 0 && <EmptyState emoji="🍪" text="暂无待制作任务，生产已清空" />}
      <div className="space-y-2">
        {pending.map((t, idx) => (
          <Card key={t.id} className="flex items-center justify-between py-2.5 bg-butter">
            <button onClick={() => toggleStatus(t.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
              <Circle size={20} />
              <span className="min-w-0">
                <p className="font-display text-sm">{t.snackName}</p>
                <p className="text-xs text-stone2-darker">{t.quantity}{t.unit} · {formatDateLabel(new Date(t.createdAt).toISOString())}</p>
              </span>
            </button>
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex flex-col">
                <button onClick={() => moveTask(t.id, 'up')} disabled={idx === 0} className="text-stone2-darker disabled:opacity-20"><ChevronUp size={15} /></button>
                <button onClick={() => moveTask(t.id, 'down')} disabled={idx === pending.length - 1} className="text-stone2-darker disabled:opacity-20"><ChevronDown size={15} /></button>
              </div>
              <button onClick={() => setEditing({ ...t })} className="text-stone2-darker ml-1"><Pencil size={16} /></button>
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
