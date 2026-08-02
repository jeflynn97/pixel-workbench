import React, { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Dices, Trash } from 'lucide-react'
import { useLocalData } from '../../lib/useLocalData.js'
import { Card, Button, Input, EmptyState, ConfirmDialog } from '../../components/ui.jsx'
import { genId } from '../../lib/utils.js'

export default function RandomPicker() {
  const [list, setList] = useLocalData('randompicker_list', [])
  const [name, setName] = useState('')
  const [rolling, setRolling] = useState(false)
  const [display, setDisplay] = useState('')
  const [result, setResult] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => clearInterval(timerRef.current), [])

  function add() {
    if (!name.trim()) return
    setList([{ id: genId(), name: name.trim() }, ...list])
    setName('')
  }
  function remove(id) {
    setList(list.filter((i) => i.id !== id))
  }
  function clearAll() {
    setList([])
    setConfirmClear(false)
    setResult(null)
  }

  function roll() {
    if (list.length === 0 || rolling) return
    setRolling(true)
    setResult(null)
    let count = 0
    const maxTicks = 18
    timerRef.current = setInterval(() => {
      const pick = list[Math.floor(Math.random() * list.length)]
      setDisplay(pick.name)
      count += 1
      if (count >= maxTicks) {
        clearInterval(timerRef.current)
        const finalPick = list[Math.floor(Math.random() * list.length)]
        setDisplay(finalPick.name)
        setResult(finalPick.name)
        setRolling(false)
      }
    }, 80)
  }

  return (
    <div className="px-4 pt-3 space-y-3 pb-6">
      <Card className="bg-pink-light text-center py-8">
        <div className="font-pixel text-lg mb-4 min-h-[28px]">
          {display || '今天吃什么？'}
        </div>
        <Button size="lg" onClick={roll} disabled={list.length === 0 || rolling}>
          <Dices size={20} className="inline -mt-0.5 mr-1.5" />
          {rolling ? '抽取中…' : '随机抽一个'}
        </Button>
        {result && !rolling && (
          <p className="text-xs text-stone2-darker mt-3 font-display">就决定是你了！</p>
        )}
      </Card>

      <Card>
        <div className="flex gap-2">
          <Input
            placeholder="添加备选食物/餐厅"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            className="flex-1"
          />
          <Button onClick={add}><Plus size={16} /></Button>
        </div>
      </Card>

      {list.length === 0 ? (
        <EmptyState emoji="🍽️" text="先添加几个备选项吧" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {list.map((i) => (
            <div key={i.id} className="pixel-corners-sm border-2 border-ink bg-white px-3 py-1.5 text-sm flex items-center gap-2">
              {i.name}
              <button onClick={() => remove(i.id)} className="text-stone2-darker"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {list.length > 0 && (
        <Button variant="danger" size="sm" onClick={() => setConfirmClear(true)}>
          <Trash size={14} className="inline -mt-0.5 mr-1" />清空列表
        </Button>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="清空备选列表？"
        desc="将删除所有已添加的备选项，此操作不可恢复。"
        onConfirm={clearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  )
}
