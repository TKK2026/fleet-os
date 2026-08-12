'use client'
import { useState } from 'react'
import { Vehicle, TaxSettings } from '@/types/vehicle'
import { calcSale, yen, yenM, elapsedMonths } from '@/lib/calc'
import { calcScore, scoreRating } from '@/lib/score'
import DepreciationChart from './DepreciationChart'
import { X, Zap } from 'lucide-react'

const SCORE_BAR: Record<string, string> = {
  green: 'bg-[#639922]', amber: 'bg-[#EF9F27]', blue: 'bg-[#378ADD]', red: 'bg-[#E24B4A]',
}
const SCORE_TEXT: Record<string, string> = {
  green: 'text-[#27500A]', amber: 'text-[#633806]', blue: 'text-[#0C447C]', red: 'text-[#791F1F]',
}

type Props = {
  vehicle: Vehicle
  settings: TaxSettings
  onClose: () => void
  onUpdateAA: (no: number, aa: number) => void
  onUpdateKm: (no: number, km: number) => void
}

export default function DetailPanel({ vehicle: v, settings, onClose, onUpdateAA, onUpdateKm }: Props) {
  const [aaInput, setAaInput] = useState(v.aa_price ? String(v.aa_price) : '')
  const [kmInput, setKmInput] = useState(v.km !== null && v.km !== undefined ? String(v.km) : '')
  const c = calcSale(v, settings)
  const months = elapsedMonths(v.acquired)
  const sc = calcScore(v)
  const rating = scoreRating(sc.total)

  const handleApply = () => {
    const val = parseFloat(aaInput)
    if (!val || val <= 0) return
    onUpdateAA(v.no, val)
  }

  const handleKmApply = () => {
    const val = parseInt(kmInput)
    if (isNaN(val) || val < 0) return
    onUpdateKm(v.no, val)
  }

  const gainColor = (n: number | null) =>
    n === null ? 'text-[#9A9890]' : n >= 0 ? 'text-[#27500A]' : 'text-[#791F1F]'

  return (
    <div className="bg-white border border-[#E4E2DC] rounded-xl p-5 shadow-sm mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-medium text-[#1A1916]">{v.plate} — {v.name}</div>
          <div className="text-xs text-[#5A5850] mt-0.5">{v.owner} ｜ 取得日 {v.acquired} ｜ {v.color} ｜ VIN: {v.vin}</div>
        </div>
        <button onClick={onClose} className="text-[#9A9890] hover:text-[#1A1916] transition-colors"><X size={18} /></button>
      </div>

      <div className="grid grid-cols-6 gap-2 mb-4">
        {[
          { label: '修正取得額', value: yen(v.cost), sub: '補助金等控除前' },
          { label: '現在簿価', value: yen(v.book_value), sub: '償却残高（帳簿値）', cls: 'text-[#0C447C]' },
          { label: '簿価＋補助金', value: yen(v.bv_subsidy), sub: '実質コスト換算', cls: 'text-[#633806]' },
          { label: 'AA相場', value: c.aa ? yen(c.aa) : '未入力', sub: '将来API連動予定', cls: c.aa ? 'text-[#633806]' : 'text-[#9A9890]' },
          { label: '走行距離', value: v.km !== null && v.km !== undefined ? v.km.toLocaleString() + ' km' : '未入力', sub: '手動更新' },
          { label: '月間償却額', value: yen(v.dep_monthly), sub: `経過${months}ヶ月 / 耐用${v.life}年` },
        ].map(({ label, value, sub, cls }) => (
          <div key={label} className="bg-[#F2F0EC] rounded-lg border border-[#E4E2DC] p-3">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-[#5A5850] mb-1">{label}</div>
            <div className={`text-sm font-medium ${cls || 'text-[#1A1916]'}`}>{value}</div>
            <div className="text-[10px] text-[#9A9890] mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 bg-[#F2F0EC] border border-[#E4E2DC] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-semibold tracking-widest uppercase text-[#5A5850]">売却スコア（100点満点）</div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${SCORE_TEXT[rating.color]}`}>{sc.total}</span>
            <span className={`text-xs font-medium ${SCORE_TEXT[rating.color]}`}>{rating.label}</span>
          </div>
        </div>
        {!sc.hasAA && <div className="text-[10px] text-[#791F1F] mb-2">※AA相場が未入力のため①簿価乖離率は0点です。査定額を入力すると再計算されます。</div>}
        <div className="grid grid-cols-4 gap-3">
          {[
            { k: '① 簿価乖離率', v: sc.bookGap, max: 30 },
            { k: '② 走行距離リスク', v: sc.kmRisk, max: 25 },
            { k: '③ 市場トレンド', v: sc.trend, max: 25 },
            { k: '④ 経過月数', v: sc.elapsed, max: 20 },
          ].map(({ k, v: val, max }) => (
            <div key={k}>
              <div className="flex justify-between text-[10px] text-[#5A5850] mb-1">
                <span>{k}</span><span className="font-medium text-[#1A1916]">{val}<span className="text-[#9A9890]">/{max}</span></span>
              </div>
              <div className="h-2 bg-[#E4E2DC] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${SCORE_BAR[rating.color]}`} style={{ width: `${Math.round((val / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {!c.aa ? (
        <div className="mb-4 p-3 rounded-lg border-l-4 border-[#378ADD] bg-[#E6F1FB] text-[#0C447C] text-xs">AA相場が未入力です。右側の入力欄から査定額を入力すると売却損益・税引後手取りがリアルタイムで計算されます。</div>
      ) : c.gain !== null && c.gain < 0 ? (
        <div className="mb-4 p-3 rounded-lg border-l-4 border-[#E24B4A] bg-[#FCEBEB] text-[#791F1F] text-xs">📉 売却損 {yenM(Math.abs(c.gain))} — AA相場が簿価＋補助金を下回っています。売却タイミングを再検討するか相場回復を待つことを推奨します。</div>
      ) : c.gain !== null && c.gain > 0 ? (
        <div className="mb-4 p-3 rounded-lg border-l-4 border-[#639922] bg-[#EAF3DE] text-[#27500A] text-xs">✅ 売却益 {yenM(c.gain)} — 法人税負担 {yenM(c.corp_tax_amount)} を考慮した税引後手取りは {yenM(c.take_home)} です。</div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="bg-[#F2F0EC] border border-[#E4E2DC] rounded-lg p-4">
            <div className="text-[10px] font-semibold tracking-widest uppercase text-[#5A5850] mb-3">売却損益の内訳</div>
            {c.aa ? (
              <div>
                {[
                  { k: 'AA相場（売却額・税抜）', v: yen(c.aa) },
                  { k: `消費税額（買手負担 ${settings.consumption_tax}%）`, v: c.ct_amount ? yen(c.ct_amount) : '−' },
                  { k: '税込売却総額', v: c.aa && c.ct_amount ? yen(c.aa + c.ct_amount) : '−' },
                ].map(({ k, v }) => (
                  <div key={k} className="flex justify-between py-1.5 border-b border-[#E4E2DC] text-xs">
                    <span className="text-[#5A5850]">{k}</span><span className="font-medium">{v}</span>
                  </div>
                ))}
                <div className="my-2 border-t border-[#CFCDC6]" />
                {[
                  { k: '現在簿価（帳簿）', v: yen(v.book_value), cls: 'text-[#0C447C]' },
                  { k: '補助金戻入相当', v: yen(v.subsidy) },
                  { k: '簿価＋補助金（実質）', v: yen(v.bv_subsidy), cls: 'text-[#633806]' },
                  { k: '売却損益①（相場−簿価）', v: yenM(c.gain2), cls: gainColor(c.gain2) },
                  { k: '売却損益②（相場−実質）', v: yenM(c.gain), cls: gainColor(c.gain) },
                  { k: `法人税負担（${settings.corp_tax}%）`, v: c.corp_tax_amount > 0 ? `△${yen(c.corp_tax_amount)}` : 'なし', cls: 'text-[#791F1F]' },
                ].map(({ k, v, cls }) => (
                  <div key={k} className="flex justify-between py-1.5 border-b border-[#E4E2DC] text-xs">
                    <span className="text-[#5A5850]">{k}</span><span className={`font-medium ${cls || ''}`}>{v}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2.5 text-sm font-semibold border-t-2 border-[#CFCDC6] mt-1">
                  <span>税引後 手取り</span>
                  <span className={gainColor(c.take_home)} style={{ fontSize: '16px' }}>{yenM(c.take_home)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#9A9890] py-3">AA相場を入力すると損益内訳が表示されます</p>
            )}
          </div>
          <div className="mt-3 bg-[#F2F0EC] border border-[#E4E2DC] rounded-lg p-4">
            <div className="text-[10px] font-semibold tracking-widest uppercase text-[#5A5850] mb-3">簿価推移（定率法）</div>
            <DepreciationChart vehicle={v} currentAA={c.aa} />
          </div>
        </div>

        <div className="bg-[#F2F0EC] border border-[#E4E2DC] rounded-lg p-4">
          <div className="text-[10px] font-semibold tracking-widest uppercase text-[#5A5850] mb-3">AA相場を入力・更新</div>
          <label className="text-xs text-[#5A5850] block mb-1.5 font-medium">現在のAA相場 / 査定額（円）</label>
          <div className="flex gap-2 mb-1">
            <input type="number" value={aaInput} onChange={e => setAaInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleApply()} placeholder="例: 1400000" step={10000} className="flex-1 text-sm px-3 py-2 rounded-lg border border-[#CFCDC6] bg-white focus:outline-none focus:border-[#0C447C]" />
            <button onClick={handleApply} className="px-4 py-2 bg-[#1A1916] text-white text-xs rounded-lg hover:opacity-80 font-medium">更新</button>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#9A9890] mb-4"><Zap size={10} />将来的にオークション相場APIと連動予定</div>

          <div className="border-t border-[#E4E2DC] pt-4 mb-4">
            <label className="text-xs text-[#5A5850] block mb-1.5 font-medium">走行距離（km）</label>
            <div className="flex gap-2">
              <input type="number" value={kmInput} onChange={e => setKmInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleKmApply()} placeholder="例: 19206" step={100} className="flex-1 text-sm px-3 py-2 rounded-lg border border-[#CFCDC6] bg-white focus:outline-none focus:border-[#0C447C]" />
              <button onClick={handleKmApply} className="px-4 py-2 bg-[#1A1916] text-white text-xs rounded-lg hover:opacity-80 font-medium">更新</button>
            </div>
            <div className="text-[10px] text-[#9A9890] mt-1.5">走行距離は売却判断の重要指標です。定期的に更新してください。</div>
          </div>

          {c.aa && (
            <>
              <div className="text-[10px] font-semibold tracking-widest uppercase text-[#5A5850] mb-3">税引後 手取りサマリー</div>
              <table className="w-full text-xs">
                <tbody>
                  {[
                    { k: '売却損益（実質）', v: yenM(c.gain), cls: gainColor(c.gain) },
                    { k: `法人税負担（${settings.corp_tax}%）`, v: c.corp_tax_amount > 0 ? `△${yenM(c.corp_tax_amount)}` : 'なし', cls: 'text-[#791F1F]' },
                  ].map(({ k, v, cls }) => (
                    <tr key={k} className="border-b border-[#E4E2DC]">
                      <td className="py-2 text-[#5A5850]">{k}</td>
                      <td className={`py-2 text-right font-medium ${cls}`}>{v}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="pt-3 font-semibold text-[#1A1916]">税引後 手取り</td>
                    <td className={`pt-3 text-right font-bold text-xl ${gainColor(c.take_home)}`}>{yenM(c.take_home)}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
