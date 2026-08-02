import React, { useState } from 'react'
import { Plus, Trash2, ChefHat, Carrot } from 'lucide-react'
import { useLocalData } from '../../lib/useLocalData.js'
import {
  Card, Button, Input, Textarea, SegmentedTabs, SectionTitle, EmptyState, Modal,
} from '../../components/ui.jsx'
import { genId } from '../../lib/utils.js'

const TABS = [
  { value: 'stock', label: '家庭食材库存' },
  { value: 'recipes', label: '食谱收藏' },
]

export default function Recipes() {
  const [tab, setTab] = useState('recipes')
  return (
    <div className="px-4 pt-3">
      <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />
      <div className="mt-3">
        {tab === 'stock' && <StockTab />}
        {tab === 'recipes' && <RecipeListTab />}
      </div>
    </div>
  )
}

function StockTab() {
  const [stock, setStock] = useLocalData('recipes_stock', [])
  const [form, setForm] = useState({ name: '', amount: '', unit: '' })

  function add() {
    if (!form.name) return
    setStock([{ id: genId(), ...form }, ...stock])
    setForm({ name: '', amount: '', unit: '' })
  }
  function remove(id) {
    setStock(stock.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-3 pb-6">
      <Card>
        <SectionTitle><span className="flex items-center gap-1.5"><Carrot size={18} />新增食材</span></SectionTitle>
        <div className="flex gap-2">
          <Input placeholder="食材名" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="flex-1" />
          <Input placeholder="数量" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-16" />
          <Input placeholder="单位" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-16" />
          <Button size="sm" onClick={add}><Plus size={16} /></Button>
        </div>
      </Card>
      {stock.length === 0 && <EmptyState emoji="🥕" text="冰箱空空如也" />}
      <div className="flex flex-wrap gap-2">
        {stock.map((s) => (
          <div key={s.id} className="pixel-corners-sm border-2 border-ink bg-white px-3 py-1.5 text-sm flex items-center gap-2">
            {s.name} {s.amount}{s.unit}
            <button onClick={() => remove(s.id)} className="text-stone2-darker"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecipeListTab() {
  const [recipes, setRecipes] = useLocalData('recipes_list', [])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', ingredients: '', steps: '' })
  const [viewing, setViewing] = useState(null)

  function save() {
    if (!form.name.trim()) return
    setRecipes([{ id: genId(), ...form }, ...recipes])
    setForm({ name: '', ingredients: '', steps: '' })
    setModalOpen(false)
  }
  function remove(id) {
    setRecipes(recipes.filter((r) => r.id !== id))
    setViewing(null)
  }

  return (
    <div className="space-y-3 pb-6">
      <Button className="w-full" onClick={() => setModalOpen(true)}>
        <Plus size={16} className="inline -mt-0.5 mr-1" />收藏新食谱
      </Button>

      {recipes.length === 0 && <EmptyState emoji="📖" text="还没有收藏的食谱" />}
      <div className="grid grid-cols-2 gap-2">
        {recipes.map((r) => (
          <button key={r.id} onClick={() => setViewing(r)} className="text-left">
            <Card className="h-full bg-mint">
              <ChefHat size={20} className="mb-1.5" />
              <p className="font-display text-sm">{r.name}</p>
            </Card>
          </button>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="收藏新食谱"
        footer={<Button className="w-full" onClick={save}>保存食谱</Button>}>
        <div className="space-y-2.5">
          <Input label="食谱名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea label="所需食材（每行一个）" rows={4} value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} />
          <Textarea label="烹饪步骤" rows={6} value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} />
        </div>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.name}
        footer={<Button variant="danger" onClick={() => remove(viewing.id)}>删除此食谱</Button>}>
        {viewing && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-display text-xs text-stone2-darker mb-1">所需食材</p>
              <p className="whitespace-pre-line">{viewing.ingredients || '（未填写）'}</p>
            </div>
            <div>
              <p className="font-display text-xs text-stone2-darker mb-1">烹饪步骤</p>
              <p className="whitespace-pre-line">{viewing.steps || '（未填写）'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
