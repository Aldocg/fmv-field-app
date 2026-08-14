import {createClient} from '@supabase/supabase-js'
const url=import.meta.env.VITE_SUPABASE_URL
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
if(!url||!key) console.warn('Missing Supabase environment variables.')
export const supabase=createClient(url||'https://placeholder.supabase.co',key||'placeholder',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
