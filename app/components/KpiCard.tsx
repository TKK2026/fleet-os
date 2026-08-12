type Props = {
  label: string
  value: string
  sub?: string
  color?: 'blue' | 'green' | 'red' | 'amber' | 'default'
}

const colorMap = {
  blue:    'text-[#0C447C]',
  green:   'text-[#27500A]',
  red:     'text-[#791F1F]',
  amber:   'text-[#633806]',
  default: 'text-[#1A1916]',
}

export default function KpiCard({ label, value, sub, color = 'default' }: Props) {
  return (
    <div className="bg-white rounded-xl border border-[#E4E2DC] p-4 shadow-sm">
      <div className="text-[10px] font-semibold tracking-widest uppercase text-[#5A5850] mb-1">{label}</div>
      <div className={`text-xl font-medium leading-tight ${colorMap[color]}`}>{value}</div>
      {sub && <div className="text-[10px] text-[#9A9890] mt-1">{sub}</div>}
    </div>
  )
}
