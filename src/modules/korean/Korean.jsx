import React, { useState } from 'react'
import { Flame, Check, RotateCw } from 'lucide-react'
import { useLocalData } from '../../lib/useLocalData.js'
import { Card, SegmentedTabs, SectionTitle, EmptyState, Button } from '../../components/ui.jsx'
import { todayStr, formatDateLabel } from '../../lib/utils.js'
import { HANGUL_CONSONANTS, HANGUL_VOWELS, KOREAN_LESSONS } from '../../lib/koreanContent.js'

const TABS = [
  { value: 'checkin', label: '打卡' },
  { value: 'hangul', label: '韩文字母' },
  { value: 'phrases', label: '常用短语' },
]

function computeStreak(checkins) {
  let streak = 0
  const cursor = new Date()
  // 如果今天还没打卡，从昨天开始往前数，今天不算断
  if (!checkins[todayStr()]) {
    cursor.setDate(cursor.getDate() - 1)
  }
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    if (checkins[key]) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export default function Korean() {
  const [tab, setTab] = useState('checkin')
  return (
    <div className="px-4 pt-3">
      <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />
      <div className="mt-3">
        {tab === 'checkin' && <CheckinTab />}
        {tab === 'hangul' && <HangulTab />}
        {tab === 'phrases' && <PhrasesTab />}
      </div>
    </div>
  )
}

function CheckinTab() {
  const [checkins, setCheckins] = useLocalData('korean_checkins', {})
  const [mastered] = useLocalData('korean_mastered', {})
  const today = todayStr()
  const doneToday = !!checkins[today]
  const streak = computeStreak(checkins)
  const totalDays = Object.keys(checkins).filter((k) => checkins[k]).length
  const totalPhrases = KOREAN_LESSONS.reduce((s, l) => s + l.phrases.length, 0)
  const masteredCount = Object.values(mastered).filter(Boolean).length

  function toggleToday() {
    setCheckins({ ...checkins, [today]: !doneToday })
  }

  const historyDates = Object.keys(checkins)
    .filter((d) => checkins[d])
    .sort((a, b) => (a < b ? 1 : -1))
    .slice(0, 14)

  return (
    <div className="space-y-3 pb-6">
      <Card className="bg-pink-light text-center py-6">
        <div className="flex items-center justify-center gap-1.5 text-pink-dark mb-1">
          <Flame size={22} />
          <span className="font-pixel text-xl">{streak}</span>
        </div>
        <p className="text-xs text-stone2-darker mb-4">连续打卡天数</p>
        <Button variant={doneToday ? 'mint' : 'primary'} size="lg" onClick={toggleToday}>
          {doneToday ? <><Check size={18} className="inline -mt-0.5 mr-1.5" />今天已打卡</> : '今天学韩语了，打卡！'}
        </Button>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <div className="pixel-corners-sm bg-white border-2 border-ink px-3 py-2">
          <p className="text-xs text-stone2-darker">累计打卡</p>
          <p className="font-display text-base">{totalDays} 天</p>
        </div>
        <div className="pixel-corners-sm bg-white border-2 border-ink px-3 py-2">
          <p className="text-xs text-stone2-darker">已掌握短语</p>
          <p className="font-display text-base">{masteredCount} / {totalPhrases}</p>
        </div>
      </div>

      <SectionTitle>打卡记录</SectionTitle>
      {historyDates.length === 0 && <EmptyState emoji="🇰🇷" text="还没有打卡记录，今天开始吧" />}
      <div className="flex flex-wrap gap-2">
        {historyDates.map((d) => (
          <span key={d} className="pixel-corners-sm bg-mint border-2 border-ink px-2 py-1 text-xs font-display">
            {formatDateLabel(d)}
          </span>
        ))}
      </div>
    </div>
  )
}

function HangulTab() {
  return (
    <div className="space-y-3 pb-6">
      <Card>
        <SectionTitle>基本辅音</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {HANGUL_CONSONANTS.map((c) => (
            <div key={c.id} className="pixel-corners-sm bg-white border-2 border-ink px-2 py-2 text-center">
              <p className="text-2xl">{c.char}</p>
              <p className="text-xs text-stone2-darker mt-1">{c.romanization}</p>
              <p className="text-[11px] text-stone2-darker">{c.example}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SectionTitle>基本元音</SectionTitle>
        <div className="grid grid-cols-4 gap-2">
          {HANGUL_VOWELS.map((v) => (
            <div key={v.id} className="pixel-corners-sm bg-mint border-2 border-ink px-2 py-2 text-center">
              <p className="text-2xl">{v.char}</p>
              <p className="text-xs text-stone2-darker mt-1">{v.romanization}</p>
            </div>
          ))}
        </div>
      </Card>
      <p className="text-xs text-stone2-darker text-center">辅音 + 元音 拼在一起就是一个韩文字，比如 ㄱ + ㅏ = 가 (ga)</p>
    </div>
  )
}

function PhrasesTab() {
  const [lessonId, setLessonId] = useState(KOREAN_LESSONS[0].id)
  const lesson = KOREAN_LESSONS.find((l) => l.id === lessonId)
  const lessonTabs = KOREAN_LESSONS.map((l) => ({ value: l.id, label: `${l.emoji} ${l.title}` }))

  return (
    <div className="space-y-3 pb-6">
      <SegmentedTabs tabs={lessonTabs} value={lessonId} onChange={setLessonId} />
      <div className="grid grid-cols-1 gap-2 mt-2">
        {lesson.phrases.map((p) => (
          <PhraseCard key={p.id} phrase={p} />
        ))}
      </div>
    </div>
  )
}

function PhraseCard({ phrase }) {
  const [flipped, setFlipped] = useState(false)
  const [mastered, setMastered] = useLocalData('korean_mastered', {})
  const isMastered = !!mastered[phrase.id]

  function toggleMastered(e) {
    e.stopPropagation()
    setMastered({ ...mastered, [phrase.id]: !isMastered })
  }

  return (
    <Card
      className={`cursor-pointer ${isMastered ? 'bg-mint' : 'bg-white'}`}
      onClick={() => setFlipped(!flipped)}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="font-display text-lg">{phrase.kr}</p>
          {flipped && (
            <>
              <p className="text-sm text-stone2-darker mt-1">{phrase.ro}</p>
              <p className="text-sm mt-0.5">{phrase.zh}</p>
            </>
          )}
          {!flipped && <p className="text-xs text-stone2-darker mt-1">点一下卡片查看读音和意思</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <RotateCw size={16} className="text-stone2-darker" />
          <button
            onClick={toggleMastered}
            className={`pixel-corners-sm border-2 border-ink px-2 py-1 text-[11px] font-display ${isMastered ? 'bg-pink' : 'bg-white'}`}
          >
            {isMastered ? '已掌握 ✓' : '标记掌握'}
          </button>
        </div>
      </div>
    </Card>
  )
}
