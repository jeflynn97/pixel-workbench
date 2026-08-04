import { createClient } from '@supabase/supabase-js'

// 这两个是"可公开"的密钥（publishable / anon key），设计上就是允许暴露在前端代码里的，
// 真正的数据安全由 Supabase 数据库里的 Row Level Security 规则保证（每个用户只能读写自己的数据）。
const SUPABASE_URL = 'https://czqyadhnappmwlcdyuwx.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_LF3daoM6m6-lxbkefCQrjg_QSq1KtYY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
