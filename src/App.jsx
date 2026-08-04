import React, { useEffect, useState } from 'react'
import Home from './pages/Home.jsx'
import Header from './components/Header.jsx'
import Finance from './modules/finance/Finance.jsx'
import Todos from './modules/todos/Todos.jsx'
import Workshop from './modules/workshop/Workshop.jsx'
import Life from './modules/life/Life.jsx'
import Watchlist from './modules/watchlist/Watchlist.jsx'
import FoodMap from './modules/foodmap/FoodMap.jsx'
import RandomPicker from './modules/randompicker/RandomPicker.jsx'
import Recipes from './modules/recipes/Recipes.jsx'

const MODULE_MAP = {
  finance: { title: '全能记账', emoji: '💰', Comp: Finance },
  todos: { title: '公私待办', emoji: '📋', Comp: Todos },
  workshop: { title: '店铺工作台', emoji: '🏭', Comp: Workshop },
  life: { title: '生活记录', emoji: '🌿', Comp: Life },
  watchlist: { title: '追剧清单', emoji: '🎬', Comp: Watchlist },
  foodmap: { title: '美食地图', emoji: '📍', Comp: FoodMap },
  randompicker: { title: '随机点餐', emoji: '🎲', Comp: RandomPicker },
  recipes: { title: '食谱管理', emoji: '📖', Comp: Recipes },
}

export default function App() {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.replace('#', '')
    return MODULE_MAP[hash] ? hash : null
  })

  useEffect(() => {
    window.location.hash = route || ''
  }, [route])

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      setRoute(MODULE_MAP[hash] ? hash : null)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // 注册 Service Worker（生产构建时 vite-plugin-pwa 会注入 virtual:pwa-register）
  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      import('virtual:pwa-register')
        .then(({ registerSW }) => registerSW({ immediate: true }))
        .catch(() => {})
    }
  }, [])

  if (!route) {
    return <Home onNavigate={(key) => setRoute(key)} />
  }

  const { title, emoji, Comp } = MODULE_MAP[route]
  return (
    <div className="min-h-screen min-h-[100dvh]">
      <Header title={title} emoji={emoji} onBack={() => setRoute(null)} />
      <main className="max-w-3xl mx-auto pb-24">
        <Comp />
      </main>
    </div>
  )
}
