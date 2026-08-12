'use client'
import { useState, useMemo } from 'react'
import { MASTER_VEHICLES } from '@/lib/masterData'
import { calcSale, yen, yenM } from '@/lib/calc'
import { calcScore, scoreRating } from '@/lib/score'
import { Vehicle, TaxSettings } from '@/types/vehicle'
import KpiCard from './components/KpiCard'
import PriorityBadge from './components/PriorityBadge'
import DetailPanel from './components/DetailPanel'
import MarketPanel from './components/MarketPanel'

const SCORE_COLOR: Record<string, string> = {
  green: 'bg-[#EAF3DE] text-[#27500A] border-[#97C459]',
  amber: 'bg-[#FAEEDA] text-[#633806] border-[#EF9F27]',
  blue:  'bg-[#E6F1FB] text-[#0C447C] border-[#85B7EB]',
  red:   'bg-[#FCEBEB] text-[#791F1F] border-[#F09595]',
}

type Filter = 'all' | 'fortune' | 'kenen' | 'atto3' | 'dolphin' | 'hasaa' | 'noaa'
type SortKey = 'no' | 'gain_desc' | 'gain_asc' | 'bv_asc' | 'km_desc' | 'priority' | 'score_desc'
type Tab = 'list' | 'market' | 'settings'

export default function Home() {
  const [tab, setTab] = useState<Tab>('list')
  const [filter, setFilter] = useState<Filter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('no')
  const [search, setSearch] = useState('')
  const [selNo, setSelNo] = useState<number | null>(null)
  const [aaOverride, setAaOverride] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {}
    MASTER_VEHICLES.forEach(v => { if (v.aa_price) init[v.no] = v.aa_price })
    return init
  })
  const [kmOverride, setKmOverride] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {}
    MASTER_VEHICLES.forEach(v => { if (v.km !== null && v.km !== undefined) init[v.no] = v.km as number })
    return init
  })
  const [settings, setSettings] = useState<TaxSettings>({ corp_tax: 23.2, consumption_tax: 10 })

  const vehicles: Vehicle[] = useMemo(() =>
    MASTER_VEHICLES.map(v => ({
      ...v,
      aa_price: aaOverride[v.no] ?? null,
      km: v.no in kmOverride ? kmOverride[v.no] : v.km,
    })),
    [aaOverride, kmOverride]
  )

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    let data = vehicles.filter(v => {
      if (filter === 'fortune') return v.owner === 'Fortune.'
      if (filter === 'kenen')   return v.owner === '賢英'
      if (filter === 'atto3')   return v.name.includes('ATTO3')
      if (filter === 'dolphin') return v.name.includes('DOLPHIN')
      if (filter === 'hasaa')   return v.aa_price !== null
      if (filter === 'noaa')    return v.aa_price === null
      return true
    }).filter(v =>
      !q || v.plate.toLowerCase().includes(q) || v.name.toLowerCase().includes(q) || (v.vin || '').toLowerCase().includes(q)
    )
    data = [...data].sort((a, b) => {
      const ca = calcSale(a, settings), cb = calcSale(b, settings)
      if (sortKey === 'gain_desc') return (cb.gain ?? -Infinity) - (ca.gain ?? -Infinity)
      if (sortKey === 'gain_asc')  return (ca.gain ?? Infinity)  - (cb.gain ?? Infinity)
      if (sortKey === 'bv_asc')    return a.book_value - b.book_value
      if (sortKey === 'km_desc')   return (b.km ?? 0) - (a.km ?? 0)
      if (sortKey === 'score_desc') return calcScore(b).total - calcScore(a).total
      if (sortKey === 'priority') {
        const m: Record<string,number> = {'①':1,'②':2,'③':3,'④':4,'':9}
        return (m[a.priority]??9)-(m[b.priority]??9)
      }
      return a.no - b.no
    })
    return data
  }, [vehicles, filter, sortKey, search, settings])

  const kpi = useMemo(() => {
    const totalCost = vehicles.reduce((s,v)=>s+v.cost,0)
    const totalBV   = vehicles.reduce((s,v)=>s+v.book_value,0)
    const totalBVS  = vehicles.reduce((s,v)=>s+v.bv_subsidy,0)
    const withAA    = vehicles.filter(v=>v.aa_price)
    const totalAA   = withAA.reduce((s,v)=>s+(v.aa_price??0),0)
    const totalGain = withAA.reduce((s,v)=>s+(calcSale(v,settings).gain??0),0)
    return { totalCost,totalBV,totalBVS,totalAA,totalGain,withAA:withAA.length }
  }, [vehicles, settings])

  const handleUpdateAA = (no: number, aa: number) => setAaOverride(prev=>({...prev,[no]:aa}))
  const handleUpdateKm = (no: number, km: number) => setKmOverride(prev=>({...prev,[no]:km}))
  const selectedVehicle = selNo !== null ? vehicles.find(v=>v.no===selNo) : null

  const filters: {key:Filter;label:string}[] = [
    {key:'all',label:'全車両'},{key:'fortune',label:'Fortune.'},{key:'kenen',label:'賢英'},
    {key:'atto3',label:'ATTO3'},{key:'dolphin',label:'DOLPHIN'},
    {key:'hasaa',label:'AA相場あり'},{key:'noaa',label:'AA未入力'},
  ]

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="max-w-[1280px] mx-auto px-5 py-6">
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-[#1A1916]">車両売却管理</h1>
            <p className="text-xs mt-1 text-[#5A5850]">固定資産台帳連動 ｜ 簿価（200%定率法）× AA相場 × 税引後手取り ｜ 2026年8月</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-[11px] px-3 py-1 rounded-full border bg-[#E6F1FB] text-[#0C447C] border-[#85B7EB]">全34台</span>
            <span className="text-[11px] px-3 py-1 rounded-full border bg-[#EAF3DE] text-[#27500A] border-[#97C459]">AA相場 {kpi.withAA}台入力済</span>
            <span className="text-[11px] px-3 py-1 rounded-full border border-[#E4E2DC] bg-white text-[#5A5850]">Fortune. / 賢英</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 mb-6">
          <KpiCard label="取得価額合計" value={yenM(kpi.totalCost)} sub="全34台" />
          <KpiCard label="簿価合計" value={yenM(kpi.totalBV)} sub="帳簿上の資産価値" color="blue" />
          <KpiCard label="簿価＋補助金" value={yenM(kpi.totalBVS)} sub="実質コスト換算" color="amber" />
          <KpiCard label="AA相場合計" value={kpi.withAA>0?yenM(kpi.totalAA):'−'} sub={`${kpi.withAA}台 / 全34台`} color="amber" />
          <KpiCard label="売却益合計（税前）" value={kpi.withAA>0?yenM(kpi.totalGain):'−'} sub="相場−簿価+補助金" color={kpi.totalGain>=0?'green':'red'} />
        </div>

        <div className="flex border-b border-[#E4E2DC] mb-4">
          {(['list','market','settings'] as Tab[]).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`text-sm px-4 py-2 border-b-2 -mb-px transition-colors ${tab===t?'border-[#1A1916] text-[#1A1916] font-medium':'border-transparent text-[#5A5850] hover:text-[#1A1916]'}`}>
              {t==='list'?'車両一覧':t==='market'?'📈 市場相場':'税率・設定'}
            </button>
          ))}
        </div>

        {tab==='list' && (
          <>
            <div className="flex gap-2 mb-3 flex-wrap items-center">
              {filters.map(({key,label})=>(
                <button key={key} onClick={()=>{setFilter(key);setSelNo(null)}}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filter===key?'bg-[#1A1916] text-white border-[#1A1916]':'bg-white text-[#5A5850] border-[#CFCDC6] hover:border-[#1A1916]'}`}>
                  {label}
                </button>
              ))}
              <div className="ml-auto flex gap-2">
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ナンバー・車種で検索..."
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#CFCDC6] bg-white w-48 focus:outline-none focus:border-[#0C447C]" />
                <select value={sortKey} onChange={e=>setSortKey(e.target.value as SortKey)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#CFCDC6] bg-white text-[#5A5850] focus:outline-none">
                  <option value="no">No順</option>
                  <option value="gain_desc">売却益 ↓</option>
                  <option value="gain_asc">売却益 ↑</option>
                  <option value="bv_asc">簿価 ↑</option>
                  <option value="km_desc">走行距離 ↓</option>
                  <option value="score_desc">売却スコア ↓</option>
                  <option value="priority">売却優先順位</option>
                </select>
              </div>
            </div>

            <div className="bg-white border border-[#E4E2DC] rounded-xl overflow-hidden overflow-x-auto shadow-sm mb-4">
              <table className="w-full border-collapse text-left" style={{minWidth:1080,tableLayout:'fixed'}}>
                <thead>
                  <tr className="bg-[#F2F0EC] border-b border-[#E4E2DC]">
                    {['No','所有','ナンバー / VIN','車種','走行距離','取得日','修正取得額','現在簿価','AA相場','売却損益','補助金','優先度','売却スコア','月償却額'].map(h=>(
                      <th key={h} className="text-[10px] font-semibold tracking-widest uppercase text-[#5A5850] px-3 py-2.5 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(v=>{
                    const c=calcSale(v,settings)
                    const sc=calcScore(v)
                    const rating=scoreRating(sc.total)
                    const isSel=selNo===v.no
                    const gc=c.gain===null?'text-[#9A9890]':c.gain>=0?'text-[#27500A]':'text-[#791F1F]'
                    return (
                      <tr key={v.no} onClick={()=>setSelNo(selNo===v.no?null:v.no)}
                        className={`border-b border-[#E4E2DC] cursor-pointer transition-colors ${isSel?'bg-[#E6F1FB]':'hover:bg-[#F8F7F4]'}`}>
                        <td className="px-3 py-2.5 text-[11px] text-[#9A9890]">{v.no}</td>
                        <td className="px-3 py-2.5 text-[11px] text-[#5A5850]">{v.owner}</td>
                        <td className="px-3 py-2.5">
                          <div className="text-xs font-medium">{v.plate}</div>
                          <div className="text-[10px] text-[#9A9890]">{v.vin}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[11px] px-1.5 py-0.5 rounded border border-[#E4E2DC] bg-[#F2F0EC] text-[#5A5850]">
                            {v.name.replace('BYD ','')}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-[#5A5850]">
                          <span
                            className="cursor-pointer hover:text-[#0C447C] hover:underline decoration-dotted"
                            title="クリックで走行距離を入力"
                            onClick={e=>{
                              e.stopPropagation()
                              const val=prompt(`走行距離を入力（現在: ${v.km?v.km.toLocaleString()+'km':'未入力'}）`,'')
                              if(val===null) return
                              const n=parseInt(val.replace(/,/g,''))
                              if(!isNaN(n)&&n>=0) handleUpdateKm(v.no,n)
                            }}
                          >{v.km?v.km.toLocaleString()+'km':'− 入力'}</span>
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-[#9A9890]">{v.acquired}</td>
                        <td className="px-3 py-2.5 text-xs text-[#5A5850]">{yenM(v.cost)}</td>
                        <td className="px-3 py-2.5 text-xs font-medium text-[#0C447C]">{yenM(v.book_value)}</td>
                        <td className="px-3 py-2.5 text-xs font-medium text-[#633806]">{c.aa?yenM(c.aa):<span className="text-[#9A9890]">−</span>}</td>
                        <td className={`px-3 py-2.5 text-xs font-medium ${gc}`}>{c.gain!==null?yenM(c.gain):'−'}</td>
                        <td className="px-3 py-2.5 text-xs text-[#5A5850]">{v.subsidy>0?yenM(v.subsidy):'−'}</td>
                        <td className="px-3 py-2.5"><PriorityBadge priority={v.priority} /></td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-block text-[11px] font-bold px-1.5 py-0.5 rounded border ${SCORE_COLOR[rating.color]}`}>{sc.total}</span>
                            <span className="text-[10px] text-[#9A9890]">{rating.label}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-[#5A5850]">{yenM(v.dep_monthly)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {selectedVehicle && (
              <DetailPanel vehicle={selectedVehicle} settings={settings} onClose={()=>setSelNo(null)} onUpdateAA={handleUpdateAA} onUpdateKm={handleUpdateKm} />
            )}
          </>
        )}

        {tab==='market' && <MarketPanel />}

        {tab==='settings' && (
          <div className="bg-white border border-[#E4E2DC] rounded-xl p-6 shadow-sm max-w-2xl">
            <h2 className="text-sm font-medium mb-5">⚙ 税率・計算設定</h2>
            {[
              {label:'法人税率（実効税率）',key:'corp_tax' as const,note:'中小法人軽減税率15%に変更可'},
              {label:'消費税率',key:'consumption_tax' as const,note:'売却額への消費税（買手負担）'},
            ].map(({label,key,note})=>(
              <div key={key} className="flex items-center gap-4 py-3 border-b border-[#E4E2DC]">
                <label className="text-sm text-[#5A5850] w-52 flex-shrink-0">{label}</label>
                <input type="number" value={settings[key]} step={0.1} min={0}
                  onChange={e=>setSettings(prev=>({...prev,[key]:parseFloat(e.target.value)||0}))}
                  className="text-sm px-3 py-1.5 rounded-lg border border-[#CFCDC6] w-24 focus:outline-none focus:border-[#0C447C]" />
                <span className="text-xs text-[#9A9890]">% ／ {note}</span>
              </div>
            ))}
            <div className="mt-5 p-4 bg-[#F2F0EC] rounded-lg text-xs text-[#5A5850] space-y-1.5 leading-relaxed">
              <div className="font-medium text-[#1A1916] mb-2">計算式（固定資産台帳連動）</div>
              <div>簿価 = スプレッドシートの「償却残高」をそのまま使用（200%定率法）</div>
              <div>売却損益① = AA相場 − 簿価のみ</div>
              <div>売却損益② = AA相場 − 簿価＋補助金（実質コスト換算）</div>
              <div>法人税負担 = 売却益 × 法人税率（益が出た場合のみ）</div>
              <div>消費税 = AA相場 × 消費税率（買手負担・参考表示）</div>
              <div>税引後手取り = AA相場 − 法人税負担</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
