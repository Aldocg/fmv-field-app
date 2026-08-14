import {useCallback,useEffect,useState} from 'react'
import {getOpenPlanItems} from '../services/planService'
import type {MonthlyServiceItem} from '../types/domain'
export function useOpenPlanItems(){const[items,setItems]=useState<MonthlyServiceItem[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState<string|null>(null);const refresh=useCallback(async()=>{try{setLoading(true);setError(null);setItems(await getOpenPlanItems())}catch(e){setError(e instanceof Error?e.message:'Could not load service plan.')}finally{setLoading(false)}},[]);useEffect(()=>{refresh()},[refresh]);return{items,setItems,loading,error,refresh}}
