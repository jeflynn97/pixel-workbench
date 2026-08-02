// 统一本地存储层：所有模块数据都通过这里读写 localStorage
// key 前缀，便于将来升级 schema 而不影响用户其他本地数据
export const APP_PREFIX = 'pixel_workbench_v1_'

// 所有会被「导出/导入」覆盖的数据键
// 新增模块时，只需要在这里追加 key，即可自动纳入备份/迁移体系
export const ALL_KEYS = [
  // 财务
  'finance_incomeRecords',
  'finance_fixedExpenses',
  'finance_transactions',
  'finance_categories',
  'finance_creditRepayments',
  'finance_assets',
  // 待办
  'todos',
  // 库存
  'inventory_ingredients',
  'inventory_shoppingList',
  'inventory_frozen',
  // 生活记录
  'life_logs',
  // 追剧
  'watchlist',
  // 美食地图
  'foodmap_places',
  'foodmap_fixedPoints',
  // 随机点餐
  'randompicker_list',
  // 食谱
  'recipes_stock',
  'recipes_list',
  // 工人生产任务
  'workertasks_tasks',
  'workertasks_categories',
]

export function getData(key, defaultValue) {
  try {
    const raw = localStorage.getItem(APP_PREFIX + key)
    if (raw === null || raw === undefined) return defaultValue
    return JSON.parse(raw)
  } catch (e) {
    console.error('[storage] getData failed for', key, e)
    return defaultValue
  }
}

export function setData(key, value) {
  try {
    localStorage.setItem(APP_PREFIX + key, JSON.stringify(value))
  } catch (e) {
    console.error('[storage] setData failed for', key, e)
  }
}

export function removeData(key) {
  localStorage.removeItem(APP_PREFIX + key)
}

// ---- 全局导出：把所有模块数据打包为一个 JSON 文件下载 ----
export function exportAllData() {
  const payload = {
    app: 'pixel-workbench',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data: {},
  }
  ALL_KEYS.forEach((key) => {
    const raw = localStorage.getItem(APP_PREFIX + key)
    payload.data[key] = raw !== null ? JSON.parse(raw) : null
  })

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const ts = new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, '-')
  a.href = url
  a.download = `pixel-workbench-backup-${ts}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ---- 全局导入：读取备份 JSON 并写回所有已知 key ----
// 未知/缺失字段会被跳过，保证跨版本兼容（新版本新增字段不会因旧备份而丢失默认值）
export function importAllData(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('未选择文件'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result)
        if (!payload || typeof payload !== 'object' || !payload.data) {
          throw new Error('文件格式不正确，缺少 data 字段')
        }
        let restoredCount = 0
        ALL_KEYS.forEach((key) => {
          const value = payload.data[key]
          if (value !== undefined && value !== null) {
            localStorage.setItem(APP_PREFIX + key, JSON.stringify(value))
            restoredCount += 1
          }
        })
        resolve({ restoredCount, exportedAt: payload.exportedAt })
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error || new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

// 清空全部数据（危险操作，用于「重置」场景）
export function clearAllData() {
  ALL_KEYS.forEach((key) => removeData(key))
}
