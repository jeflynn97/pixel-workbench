import React, { useState } from 'react'
import { Cloud, CloudOff, LogOut, Mail } from 'lucide-react'
import { useAuth } from '../lib/AuthContext.jsx'
import { Card, Button, Input, useToast } from './ui.jsx'

export default function AccountSync() {
  const { user, loading, signInWithOtp, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const { showToast, Toast } = useToast()

  if (loading) return null

  async function handleSend() {
    if (!email.trim()) return showToast('请输入邮箱地址')
    setSending(true)
    const { error } = await signInWithOtp(email.trim())
    setSending(false)
    if (error) {
      showToast('发送失败：' + error.message)
    } else {
      setSent(true)
      showToast('登录链接已发送，去邮箱看看 📩')
    }
  }

  if (user) {
    return (
      <Card className="mb-4 bg-mint">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Cloud size={18} className="shrink-0" />
            <div className="min-w-0">
              <p className="font-display text-sm truncate">{user.email}</p>
              <p className="text-xs text-stone2-darker">已登录 · 自动云端同步中</p>
            </div>
          </div>
          <button onClick={signOut} className="text-stone2-darker shrink-0 pixel-corners-sm border-2 border-ink bg-white px-2 py-1.5">
            <LogOut size={16} />
          </button>
        </div>
        {Toast}
      </Card>
    )
  }

  return (
    <Card className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <CloudOff size={16} />
        <span className="font-display text-sm">多设备同步（可选）</span>
      </div>
      {!sent ? (
        <>
          <p className="text-xs text-stone2-darker mb-2">
            不登录也能正常用，数据只存这台设备。登录后会自动把数据同步到云端，其他设备登录同一个邮箱就能看到。
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button size="sm" onClick={handleSend} disabled={sending}>
              <Mail size={15} className="inline -mt-0.5 mr-1" />{sending ? '发送中' : '发送登录链接'}
            </Button>
          </div>
        </>
      ) : (
        <p className="text-xs text-stone2-darker">
          登录链接已发送到 <span className="text-ink font-display">{email}</span>，去邮箱点击链接完成登录（记得看看垃圾邮件夹）。
        </p>
      )}
      {Toast}
    </Card>
  )
}
