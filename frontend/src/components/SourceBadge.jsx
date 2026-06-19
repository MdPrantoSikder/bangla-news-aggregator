import { getSourceInfo } from "../utils"

export default function SourceBadge({ sourceId, size = "sm" }) {
  const info = getSourceInfo(sourceId)
  const sizeClasses = size === "lg"
    ? "text-sm px-3 py-1"
    : "text-[11px] px-2 py-0.5"

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${info.bg} ${info.text} ${sizeClasses} tracking-wide`}>
      <span className="w-1.5 h-1.5 bg-white/80 rounded-full" />
      {info.name}
    </span>
  )
}
