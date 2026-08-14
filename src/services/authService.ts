import {supabase} from '../lib/supabase'
import type {Profile} from '../types/domain'
export async function loadProfile(id:string):Promise<Profile>{const {data,error}=await supabase.from('profiles').select('id,full_name,role,active').eq('id',id).single();if(error)throw error;if(!data)throw new Error('Profile not found.');return data as Profile}
