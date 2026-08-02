// 首次使用时的默认数据；用户后续可自由增删改，不影响已保存的数据

export const DEFAULT_EXPENSE_CATEGORIES = [
  '吃饭', '饮料', '日常用品', '美妆护肤', '衣服鞋子包包',
  '宠物消费', '加油', '医药费', '储蓄', '交通费', '礼物', '游玩费用',
].map((name) => ({ id: name, name, type: 'expense', custom: false }))

export const DEFAULT_INCOME_CATEGORIES = [
  '固定薪水', '兼职/副业', '现金持有', '其他收入',
].map((name) => ({ id: name, name, type: 'income', custom: false }))

export const DEFAULT_INGREDIENTS = [
  '鸭胸肉', '鸭柳条', '章鱼', '鸭珍', '鸭脖',
  '2kg装鸡胸肉', '牛肉碎', '小苍鱼', '小江鱼', '鸵鸟肉',
].map((name) => ({ id: name, name, packs: 0, custom: false }))

export const PAY_METHODS = [
  { id: 'cash', label: '现金' },
  { id: 'bank', label: '银行账户' },
  { id: 'credit', label: '信用卡' },
]

export const CURRENCIES = [
  { id: 'RM', label: 'RM 令吉' },
  { id: 'SGD', label: 'SGD 新币' },
]
