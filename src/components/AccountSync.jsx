import React, { useState } from 'react'
import { Cloud, CloudOff, LogOut, Mail, Link2 } from 'lucide-react'
import { useAuth } from '../lib/AuthContext.jsx'
import { Card, Button, Input, Textarea, useToast } from './ui.jsx'

export default function AccountSync() {
  const { user, loading, signInWithOtp, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [pastedLink, setPastedLink] = useState('')
  const [step, setStep] = useState('email') // 'email' | 'sent'
  const [busy, setBusy] = useState(false)
  const { showToast, Toast } = useToast()

  if (loading) return null

  async function handleSend() {
    if (!email.trim()) return showToast('请输入邮箱地址')
    setBusy(true)
    const { error } = await signInWithOtp(email.trim())
    setBusy(false)
    if (error) {
      showToast('发送失败：' + error.message)
    } else {
      setStep('sent')
      showToast('登录链接已发送 📩')
    }
  }

  function handleUseLink() {
    if (!pastedLink.trim()) return showToast('请先粘贴链接')
    // 直接在当前页面内跳转到这个链接，全程留在同一个 App 实例里，
    // 验证完成后 Supabase 会自动跳回本站并带上登录状态
    window.location.href = pastedLink.trim()
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

      {step === 'email' ? (
        <>
          <p className="text-xs text-stone2-darker mb-2">
            不登录也能正常用，数据只存这台设备。登录后会自动把数据同步到云端，其他设备用同一个邮箱登录就能看到。
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
            <Button size="sm" onClick={handleSend} disabled={busy}>
              <Mail size={15} className="inline -mt-0.5 mr-1" />{busy ? '发送中' : '发送登录链接'}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="text-xs text-stone2-darker mb-2 space-y-1">
            <p>登录链接已发送到 <span className="text-ink font-display">{email}</span>，按这几步操作（用主屏幕图标打开的话尤其要照这个方法，否则登录状态会跳丢）：</p>
            <ol className="list-decimal list-inside space-y-0.5 mt-1">
              <li>去邮箱找到那封信</li>
              <li><b>长按</b>（不要直接点）里面的 "Sign in" 链接</li>
              <li>选择 <b>"拷贝链接"</b></li>
              <li>回到这里，粘贴到下面的框里，点"用这个链接登录"</li>
            </ol>
          </div>
          <Textarea
            placeholder="粘贴复制的登录链接…"
            value={pastedLink}
            onChange={(e) => setPastedLink(e.target.value)}
            rows={3}
            className="mb-2"
          />
          <Button className="w-full" onClick={handleUseLink}>
            <Link2 size={15} className="inline -mt-0.5 mr-1" />用这个链接登录
          </Button>
          <button onClick={() => setStep('email')} className="text-xs text-stone2-darker mt-2 underline">
            换个邮箱 / 重新发送
          </button>
        </>
      )}
      {Toast}
    </Card>
  )
}
