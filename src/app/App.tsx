import { useCallback, useState } from 'react'
import LegacyApp from './LegacyApp'
import { Experience } from '../features/companion/Experience'
import type { Plan } from '../features/plan/model'
export default function App() {
  const [legacy,setLegacy]=useState(()=>['plan','walkthrough'].includes(new URLSearchParams(window.location.search).get('view') ?? ''))
  const [seed,setSeed]=useState<Plan | undefined>()
  const clearSeed=useCallback(()=>setSeed(undefined),[])
  return legacy ? <LegacyApp initialPlan={seed} clearSeed={clearSeed} returnToIntro={()=>{setSeed(undefined);setLegacy(false);window.scrollTo({top:0,behavior:'instant'})}}/> : <Experience openPlan={plan=>{setSeed(plan);setLegacy(true);window.scrollTo({top:0,behavior:'instant'})}}/>
}
