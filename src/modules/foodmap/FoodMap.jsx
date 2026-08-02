import React, { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, MapPin, Search, Home, Building2, PawPrint, Crosshair } from 'lucide-react'
import { useLocalData } from '../../lib/useLocalData.js'
import {
  Card, Button, Input, Textarea, Select, SegmentedTabs, SectionTitle,
  EmptyState, Modal, Tag, useToast,
} from '../../components/ui.jsx'
import { genId, todayStr, formatDateLabel } from '../../lib/utils.js'

const TAG_OPTIONS = ['餐厅', '咖啡馆', '游玩活动']
const DEFAULT_FIXED_POINTS = [
  { id: 'home1', label: '家庭住址 1', lat: null, lng: null },
  { id: 'home2', label: '家庭住址 2', lat: null, lng: null },
  { id: 'office', label: '上班地址', lat: null, lng: null },
]
const TABS = [
  { value: 'map', label: '地图' },
  { value: 'list', label: '地点列表' },
  { value: 'fixed', label: '固定地址' },
]

export default function FoodMap() {
  const [tab, setTab] = useState('map')
  const [places, setPlaces] = useLocalData('foodmap_places', [])
  const [fixedPoints, setFixedPoints] = useLocalData('foodmap_fixedPoints', DEFAULT_FIXED_POINTS)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [pickCoord, setPickCoord] = useState(null) // { lat, lng } 来自地图点选
  const { showToast, Toast } = useToast()

  function addPlace(place) {
    setPlaces([{ id: genId(), visits: [], ...place }, ...places])
    setAddModalOpen(false)
    setPickCoord(null)
    showToast('已添加地点 📍')
  }
  function removePlace(id) {
    setPlaces(places.filter((p) => p.id !== id))
  }
  function addVisit(placeId, visit) {
    setPlaces(places.map((p) => (p.id === placeId
      ? { ...p, visits: [{ id: genId(), ...visit }, ...p.visits] }
      : p)))
  }
  function removeVisit(placeId, visitId) {
    setPlaces(places.map((p) => (p.id === placeId
      ? { ...p, visits: p.visits.filter((v) => v.id !== visitId) }
      : p)))
  }

  return (
    <div className="px-4 pt-3 pb-6">
      <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />
      <div className="mt-3 space-y-3">
        {tab === 'map' && (
          <MapView
            places={places}
            fixedPoints={fixedPoints}
            pickingActive={addModalOpen}
            onPick={(coord) => setPickCoord(coord)}
          />
        )}
        {tab === 'map' && (
          <Button className="w-full" onClick={() => setAddModalOpen(true)}>
            <Plus size={16} className="inline -mt-0.5 mr-1" />在地图上新增地点
          </Button>
        )}

        {tab === 'list' && (
          <PlaceList places={places} onRemove={removePlace} onAddVisit={addVisit} onRemoveVisit={removeVisit} />
        )}

        {tab === 'fixed' && <FixedPointsTab fixedPoints={fixedPoints} setFixedPoints={setFixedPoints} />}
      </div>

      <Modal
        open={addModalOpen}
        onClose={() => { setAddModalOpen(false); setPickCoord(null) }}
        title="新增打卡地点"
      >
        <AddPlaceForm pickCoord={pickCoord} onSubmit={addPlace} />
      </Modal>
      {Toast}
    </div>
  )
}

function MapView({ places, fixedPoints, pickingActive, onPick }) {
  const mapDivRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!window.L || mapRef.current) return
    const map = window.L.map(mapDivRef.current, { zoomControl: true }).setView([31.2304, 121.4737], 12)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map
    // 首次挂载后修正容器尺寸
    setTimeout(() => map.invalidateSize(), 150)
  }, [])

  // 点选坐标模式
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    function handleClick(e) {
      if (pickingActive) onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
    map.on('click', handleClick)
    return () => map.off('click', handleClick)
  }, [pickingActive, onPick])

  // 渲染 marker
  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.L) return
    markersRef.current.forEach((m) => map.removeLayer(m))
    markersRef.current = []

    places.forEach((p) => {
      if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return
      const marker = window.L.marker([p.lat, p.lng]).addTo(map)
      marker.bindPopup(
        `<b>${escapeHtml(p.name)}</b><br/>${escapeHtml((p.tags || []).join(' · '))}${p.petFriendly ? ' · 🐾宠物友好' : ''}`
      )
      markersRef.current.push(marker)
    })

    fixedPoints.forEach((fp) => {
      if (typeof fp.lat !== 'number' || typeof fp.lng !== 'number') return
      const icon = window.L.divIcon({
        className: '',
        html: `<div style="background:#F6DFA0;border:2px solid #4A4038;padding:2px 6px;font-size:11px;white-space:nowrap;">${escapeHtml(fp.label)}</div>`,
      })
      const marker = window.L.marker([fp.lat, fp.lng], { icon }).addTo(map)
      markersRef.current.push(marker)
    })
  }, [places, fixedPoints])

  return (
    <Card className="p-0 overflow-hidden">
      <div ref={mapDivRef} className="w-full" style={{ height: '360px' }} />
      {pickingActive && (
        <p className="text-xs text-center py-1.5 bg-pink-light font-display">📍 点击地图为新地点选取坐标</p>
      )}
    </Card>
  )
}

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function AddPlaceForm({ pickCoord, onSubmit }) {
  const [form, setForm] = useState({ name: '', address: '', tags: [], petFriendly: false, lat: '', lng: '' })
  const [searching, setSearching] = useState(false)
  const { showToast, Toast } = useToast()

  useEffect(() => {
    if (pickCoord) {
      setForm((f) => ({ ...f, lat: pickCoord.lat.toFixed(6), lng: pickCoord.lng.toFixed(6) }))
    }
  }, [pickCoord])

  function toggleTag(tag) {
    setForm((f) => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag] }))
  }

  async function geocode() {
    if (!form.address.trim()) return showToast('请先填写地址')
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(form.address)}`
      )
      const data = await res.json()
      if (data && data[0]) {
        setForm((f) => ({ ...f, lat: Number(data[0].lat).toFixed(6), lng: Number(data[0].lon).toFixed(6) }))
        showToast('已查询到坐标 ✅')
      } else {
        showToast('未查询到坐标，可尝试在地图上手动点选')
      }
    } catch {
      showToast('查询失败，请检查网络或手动填写坐标')
    } finally {
      setSearching(false)
    }
  }

  function submit() {
    if (!form.name.trim()) return showToast('请填写店名')
    if (form.lat === '' || form.lng === '') return showToast('请先获取坐标（地址查询或地图点选）')
    onSubmit({
      name: form.name.trim(),
      address: form.address.trim(),
      tags: form.tags,
      petFriendly: form.petFriendly,
      lat: Number(form.lat),
      lng: Number(form.lng),
    })
  }

  return (
    <div className="space-y-2.5">
      <Input label="店名" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <div className="flex gap-2 items-end">
        <Input label="地址" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="flex-1" />
        <Button size="sm" onClick={geocode} disabled={searching}>
          <Search size={14} className="inline -mt-0.5 mr-1" />{searching ? '查询中' : '查坐标'}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label="纬度 lat" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="或在地图上点选" />
        <Input label="经度 lng" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="或在地图上点选" />
      </div>
      <div>
        <span className="block text-xs text-stone2-darker mb-1 font-display">标签</span>
        <div className="flex gap-2 flex-wrap">
          {TAG_OPTIONS.map((t) => (
            <Tag key={t} active={form.tags.includes(t)} onClick={() => toggleTag(t)}>{t}</Tag>
          ))}
          <Tag active={form.petFriendly} onClick={() => setForm({ ...form, petFriendly: !form.petFriendly })} color="mint">
            <PawPrint size={12} className="inline -mt-0.5 mr-1" />宠物友好
          </Tag>
        </div>
      </div>
      <Button className="w-full" onClick={submit}>保存地点</Button>
      {Toast}
    </div>
  )
}

function PlaceList({ places, onRemove, onAddVisit, onRemoveVisit }) {
  const [expandedId, setExpandedId] = useState(null)
  if (places.length === 0) return <EmptyState emoji="📍" text="还没有标记任何地点" />
  return (
    <div className="space-y-2">
      {places.map((p) => (
        <Card key={p.id}>
          <div className="flex items-start justify-between">
            <button className="text-left flex-1 min-w-0" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
              <p className="font-display text-sm flex items-center gap-1">
                <MapPin size={14} />{p.name} {p.petFriendly && <PawPrint size={13} />}
              </p>
              <p className="text-xs text-stone2-darker">{(p.tags || []).join(' · ')}{p.address ? ` · ${p.address}` : ''}</p>
              <p className="text-xs text-stone2-darker">已打卡 {p.visits?.length || 0} 次</p>
            </button>
            <button onClick={() => onRemove(p.id)} className="text-stone2-darker shrink-0"><Trash2 size={16} /></button>
          </div>
          {expandedId === p.id && (
            <VisitPanel place={p} onAddVisit={onAddVisit} onRemoveVisit={onRemoveVisit} />
          )}
        </Card>
      ))}
    </div>
  )
}

function VisitPanel({ place, onAddVisit, onRemoveVisit }) {
  const [form, setForm] = useState({ date: todayStr(), dishes: '', taste: '', priceLevel: '中', note: '' })

  function submit() {
    onAddVisit(place.id, form)
    setForm({ date: todayStr(), dishes: '', taste: '', priceLevel: '中', note: '' })
  }

  return (
    <div className="mt-3 pt-3 border-t-2 border-stone2 space-y-2.5">
      <Input label="到店日期" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      <Input label="食用菜品" value={form.dishes} onChange={(e) => setForm({ ...form, dishes: e.target.value })} />
      <Input label="口味评价" value={form.taste} onChange={(e) => setForm({ ...form, taste: e.target.value })} />
      <Select label="价格高低" value={form.priceLevel} onChange={(e) => setForm({ ...form, priceLevel: e.target.value })}>
        <option value="低">低</option>
        <option value="中">中</option>
        <option value="高">高</option>
      </Select>
      <Textarea label="个人感想" rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      <Button size="sm" onClick={submit}>保存本次打卡</Button>

      {place.visits?.length > 0 && (
        <div className="space-y-2 mt-2">
          {place.visits.map((v) => (
            <div key={v.id} className="bg-cream pixel-corners-sm p-2.5 text-xs relative">
              <button onClick={() => onRemoveVisit(place.id, v.id)} className="absolute top-2 right-2 text-stone2-darker">
                <Trash2 size={13} />
              </button>
              <p className="font-display">{formatDateLabel(v.date)} · 价格 {v.priceLevel}</p>
              {v.dishes && <p>菜品：{v.dishes}</p>}
              {v.taste && <p>口味：{v.taste}</p>}
              {v.note && <p>感想：{v.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FixedPointsTab({ fixedPoints, setFixedPoints }) {
  const { showToast, Toast } = useToast()

  function update(id, patch) {
    setFixedPoints(fixedPoints.map((fp) => (fp.id === id ? { ...fp, ...patch } : fp)))
  }

  function useCurrentLocation(id) {
    if (!navigator.geolocation) return showToast('设备不支持定位')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update(id, { lat: Number(pos.coords.latitude.toFixed(6)), lng: Number(pos.coords.longitude.toFixed(6)) })
        showToast('已获取当前位置 ✅')
      },
      () => showToast('获取定位失败，请手动输入坐标')
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone2-darker">固定标记两个家庭住址与公司地址，作为行程顺路度参考基准点。</p>
      {fixedPoints.map((fp) => (
        <Card key={fp.id}>
          <SectionTitle right={
            <Button size="sm" variant="secondary" onClick={() => useCurrentLocation(fp.id)}>
              <Crosshair size={14} className="inline -mt-0.5 mr-1" />用当前定位
            </Button>
          }>
            <span className="flex items-center gap-1.5">
              {fp.id === 'office' ? <Building2 size={16} /> : <Home size={16} />}{fp.label}
            </span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Input label="纬度 lat" value={fp.lat ?? ''} onChange={(e) => update(fp.id, { lat: e.target.value === '' ? null : Number(e.target.value) })} />
            <Input label="经度 lng" value={fp.lng ?? ''} onChange={(e) => update(fp.id, { lng: e.target.value === '' ? null : Number(e.target.value) })} />
          </div>
        </Card>
      ))}
      {Toast}
    </div>
  )
}
