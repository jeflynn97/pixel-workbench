import React, { useState } from 'react'
import { Plus, Trash2, Briefcase, User } from 'lucide-react'
import { useLocalData } from '../../lib/useLocalData.js'
import { Card, Button, Input, EmptyState, SectionTitle } from '../../components/ui.jsx'
import { genId } from '../../lib/utils.js'

function TodoSection({ title, icon: Icon, list, onAdd, onToggle, onRemove, color }) {
  const [text, setText] = useState('')
  const pending = list.filter((t) => !t.done)
  const done = list.filter((t) => t.done)

  function handleAdd() {
    if (!text.trim()) return
    onAdd(text.trim())
    setText('')
  }

  return (
    <Card className={color}>
      <SectionTitle right={<span className="text-xs font-display">{pending.length} 项未完成</span>}>
        <span className="flex items-center gap-1.5"><Icon size={18} />{title}</span>
      </SectionTitle>
      <div className="flex gap-2 mb-3">
        <Input
          placeholder={`新增${title}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1"
        />
        <Button size="sm" onClick={handleAdd}><Plus size={16} /></Button>
      </div>

      {list.length === 0 && <EmptyState emoji="✅" text="暂无事项，添加一条试试" />}

      <div className="space-y-1.5">
        {pending.map((t) => (
          <label key={t.id} className="flex items-center gap-2 bg-white pixel-corners-sm border-2 border-ink px-3 py-2">
            <input type="checkbox" checked={false} onChange={() => onToggle(t.id)} className="w-4 h-4 accent-pink-dark" />
            <span className="flex-1 text-sm">{t.text}</span>
            <button onClick={() => onRemove(t.id)} className="text-stone2-darker"><Trash2 size={15} /></button>
          </label>
        ))}
        {done.length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-stone2-darker font-display cursor-pointer">已完成 {done.length} 项</summary>
            <div className="space-y-1.5 mt-1.5">
              {done.map((t) => (
                <label key={t.id} className="flex items-center gap-2 bg-white/60 pixel-corners-sm border-2 border-stone2 px-3 py-2">
                  <input type="checkbox" checked readOnly onChange={() => onToggle(t.id)} className="w-4 h-4 accent-pink-dark" />
                  <span className="flex-1 text-sm line-through text-stone2-darker">{t.text}</span>
                  <button onClick={() => onRemove(t.id)} className="text-stone2-darker"><Trash2 size={15} /></button>
                </label>
              ))}
            </div>
          </details>
        )}
      </div>
    </Card>
  )
}

export default function Todos() {
  const [todos, setTodos] = useLocalData('todos', [])

  const work = todos.filter((t) => t.category === 'work')
  const personal = todos.filter((t) => t.category === 'personal')

  function addTodo(category, text) {
    setTodos([{ id: genId(), category, text, done: false, createdAt: Date.now() }, ...todos])
  }
  function toggle(id) {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }
  function remove(id) {
    setTodos(todos.filter((t) => t.id !== id))
  }

  return (
    <div className="px-4 pt-3 space-y-3 pb-6">
      <TodoSection
        title="工作待办" icon={Briefcase} color="bg-butter"
        list={work}
        onAdd={(text) => addTodo('work', text)}
        onToggle={toggle}
        onRemove={remove}
      />
      <TodoSection
        title="私人待办" icon={User} color="bg-pink-light"
        list={personal}
        onAdd={(text) => addTodo('personal', text)}
        onToggle={toggle}
        onRemove={remove}
      />
    </div>
  )
}
