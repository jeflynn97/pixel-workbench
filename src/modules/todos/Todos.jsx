import React, { useState } from 'react'
import { Plus, Trash2, Briefcase, User, Pencil, Check, X } from 'lucide-react'
import { useLocalData } from '../../lib/useLocalData.js'
import { Card, Button, Input, EmptyState, SectionTitle } from '../../components/ui.jsx'
import { genId } from '../../lib/utils.js'

function TodoRow({ todo, onToggle, onRemove, onEdit, muted = false }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.text)

  function save() {
    if (!draft.trim()) return
    onEdit(todo.id, draft.trim())
    setEditing(false)
  }
  function cancel() {
    setDraft(todo.text)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 bg-white pixel-corners-sm border-2 border-ink px-2 py-1.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          className="flex-1 !py-1"
          autoFocus
        />
        <button onClick={save} className="text-mint-dark shrink-0"><Check size={18} /></button>
        <button onClick={cancel} className="text-stone2-darker shrink-0"><X size={18} /></button>
      </div>
    )
  }

  return (
    <label className={`flex items-center gap-2 pixel-corners-sm border-2 px-3 py-2 ${muted ? 'bg-white/60 border-stone2' : 'bg-white border-ink'}`}>
      <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo.id)} className="w-4 h-4 accent-pink-dark" />
      <span className={`flex-1 text-sm ${muted ? 'line-through text-stone2-darker' : ''}`}>{todo.text}</span>
      <button onClick={(e) => { e.preventDefault(); setEditing(true) }} className="text-stone2-darker"><Pencil size={15} /></button>
      <button onClick={(e) => { e.preventDefault(); onRemove(todo.id) }} className="text-stone2-darker"><Trash2 size={15} /></button>
    </label>
  )
}

function TodoSection({ title, icon: Icon, list, onAdd, onToggle, onRemove, onEdit, color }) {
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
          <TodoRow key={t.id} todo={t} onToggle={onToggle} onRemove={onRemove} onEdit={onEdit} />
        ))}
        {done.length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-stone2-darker font-display cursor-pointer">已完成 {done.length} 项</summary>
            <div className="space-y-1.5 mt-1.5">
              {done.map((t) => (
                <TodoRow key={t.id} todo={t} onToggle={onToggle} onRemove={onRemove} onEdit={onEdit} muted />
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
  function edit(id, newText) {
    setTodos(todos.map((t) => (t.id === id ? { ...t, text: newText } : t)))
  }

  return (
    <div className="px-4 pt-3 space-y-3 pb-6">
      <TodoSection
        title="工作待办" icon={Briefcase} color="bg-butter"
        list={work}
        onAdd={(text) => addTodo('work', text)}
        onToggle={toggle}
        onRemove={remove}
        onEdit={edit}
      />
      <TodoSection
        title="私人待办" icon={User} color="bg-pink-light"
        list={personal}
        onAdd={(text) => addTodo('personal', text)}
        onToggle={toggle}
        onRemove={remove}
        onEdit={edit}
      />
    </div>
  )
}
