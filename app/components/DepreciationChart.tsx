'use client'
import { Vehicle } from '@/types/vehicle'
import { yenM } from '@/lib/calc'

type Props = { vehicle: Vehicle; currentAA: number | null }

export default function DepreciationChart({ vehicle, currentAA }: Props) {
  const { cost, rate, life, acquired } = vehicle
  const maxYr = Math.min(life + 1, 7)
  const acqDate = new Date(acquired.replace(/\//g, '-'))
  const nowYr = (Date.now() - acqDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

  const rows = Array.from({ length: maxYr + 1 }, (_, yr) => {
    const bv = Math.max(0, cost * Math.pow(1 - rate, yr))
    const pBV = Math.round((bv / cost) * 100)
    const pAA = currentAA ? Math.min(100, Math.round((currentAA / cost) * 100)) : null
    const isNow = Math.abs(yr - nowYr) < 0.7
    return { yr, bv, pBV, pAA, isNow }
  })

  return (
    <div className="space-y-1.5">
      {rows.map(({ yr, bv, pBV, pAA, isNow }) => (
        <div key={yr} className="flex items-center gap-2">
          <span className={`text-[10px] w-8 text-right flex-shrink-0 ${isNow ? 'font-bold text-[#0C447C]' : 'text-[#9A9890]'}`}>
            Y{yr}{isNow ? '←' : ''}
          </span>
          <div className="flex-1 h-2.5 bg-[#E4E2DC] rounded-full overflow-hidden relative">
            <div className="h-full bg-[#85B7EB] rounded-full" style={{ width: `${pBV}%` }} />
            {pAA !== null && isNow && (
              <div className="absolute top-0 h-full bg-[#EF9F27] rounded-full opacity-70" style={{ width: `${pAA}%` }} />
            )}
          </div>
          <span className={`text-[10px] w-20 text-right flex-shrink-0 ${isNow ? 'font-semibold text-[#0C447C]' : 'text-[#5A5850]'}`}>
            {yenM(bv)}
          </span>
          {isNow && currentAA && (
            <span className="text-[10px] text-[#633806] flex-shrink-0">{yenM(currentAA)} 相場</span>
          )}
        </div>
      ))}
      <div className="flex gap-4 mt-2 text-[10px] text-[#9A9890]">
        <span><span className="inline-block w-2.5 h-2.5 bg-[#85B7EB] rounded-sm align-middle mr-1" />簿価</span>
        {currentAA && <span><span className="inline-block w-2.5 h-2.5 bg-[#EF9F27] rounded-sm align-middle mr-1 opacity-70" />AA相場</span>}
      </div>
    </div>
  )
}
