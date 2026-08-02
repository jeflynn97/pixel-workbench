import { useEffect, useRef, useState } from 'react'
import { getData, setData } from './storage.js'

// 像 useState 一样使用，但会自动持久化到 localStorage
// defaultValue 只在首次挂载时使用；之后的读写都走 state + 持久化
export function useLocalData(key, defaultValue) {
  const [value, setValue] = useState(() => getData(key, defaultValue))
  const first = useRef(true)

  useEffect(() => {
    // 避免首次挂载时把「刚读出来的默认值」立刻再写回去（无意义但无害，这里仅作优化）
    if (first.current) {
      first.current = false
    }
    setData(key, value)
  }, [key, value])

  return [value, setValue]
}
