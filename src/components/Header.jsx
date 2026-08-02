import React, { useRef, useState } from 'react'
import { ArrowLeft, Download, Upload } from 'lucide-react'
import { IconButton, useToast } from './ui.jsx'
import { exportAllData, importAllData } from '../lib/storage.js'

export default function Header({ title, onBack, emoji }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const { showToast, Toast } = useToast()

  function handleExport() {
    exportAllData()
    showToast('已导出备份文件 ✅')
  }

  function handleImportClick() {
    fileRef.current?.click()
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const res = await importAllData(file)
      showToast(`导入成功，已还原 ${res.restoredCount} 项数据，正在刷新…`)
      setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      console.error(err)
      showToast('导入失败：文件格式不正确')
    } finally {
      setBusy(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur border-b-2 border-ink px-3 py-2.5 flex items-center gap-2">
      {onBack ? (
        <IconButton icon={ArrowLeft} variant="ghost" onClick={onBack} aria-label="返回" />
      ) : (
        <div className="w-9" />
      )}
      <h1 className="flex-1 font-display text-lg truncate">
        {emoji && <span className="mr-1">{emoji}</span>}
        {title}
      </h1>
      <IconButton icon={Download} variant="ghost" onClick={handleExport} aria-label="导出数据" title="导出全部数据" />
      <IconButton icon={Upload} variant="ghost" onClick={handleImportClick} disabled={busy} aria-label="导入数据" title="导入数据" />
      <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
      {Toast}
    </header>
  )
}
