import { useEffect, useRef, useState } from 'react'
import { getData, setData } from './storage.js'
import { supabase } from './supabaseClient.js'
import { useAuth } from './AuthContext.jsx'

// 像 useState 一样使用，但会自动持久化到 localStorage。
// 如果用户已登录账号，还会自动跟 Supabase 云端同步：
//   - 登录后：先去云端拉这个 key 的最新值，覆盖本地（保证换设备也能看到最新记录）
//   - 之后每次修改：本地立刻更新（不卡顿），同时悄悄同步一份到云端
// 没登录账号时，行为跟以前完全一样，只存本地，不联网。
export function useLocalData(key, defaultValue) {
  const { user } = useAuth()
  const [value, setValue] = useState(() => getData(key, defaultValue))
  const cloudLoadedRef = useRef(false)
  const currentUserIdRef = useRef(null)

  // 登录状态变化时，从云端拉取这个 key 的最新数据
  useEffect(() => {
    if (!user) {
      cloudLoadedRef.current = false
      currentUserIdRef.current = null
      return
    }
    if (currentUserIdRef.current === user.id && cloudLoadedRef.current) return

    let cancelled = false
    currentUserIdRef.current = user.id
    supabase
      .from('user_data')
      .select('value')
      .eq('user_id', user.id)
      .eq('key', key)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data && data.value !== undefined && data.value !== null) {
          setValue(data.value)
          setData(key, data.value)
        }
        cloudLoadedRef.current = true
      })
      .catch(() => {
        cloudLoadedRef.current = true
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, key])

  // 本地持久化 + （登录时）同步到云端
  useEffect(() => {
    setData(key, value)
    if (user && cloudLoadedRef.current) {
      supabase
        .from('user_data')
        .upsert(
          { user_id: user.id, key, value, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,key' }
        )
        .then(({ error }) => {
          if (error) console.error('[sync] 同步失败', key, error)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value, user?.id])

  return [value, setValue]
}
