type Props = { priority: string }

const styleMap: Record<string, string> = {
  '①': 'bg-[#EAF3DE] text-[#27500A] border-[#97C459]',
  '②': 'bg-[#E6F1FB] text-[#0C447C] border-[#85B7EB]',
  '③': 'bg-[#FAEEDA] text-[#633806] border-[#EF9F27]',
  '④': 'bg-[#FCEBEB] text-[#791F1F] border-[#F09595]',
}

export default function PriorityBadge({ priority }: Props) {
  if (!priority) return null
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${styleMap[priority] || 'bg-[#F2F0EC] text-[#5A5850] border-[#CFCDC6]'}`}>
      {priority}
    </span>
  )
}
