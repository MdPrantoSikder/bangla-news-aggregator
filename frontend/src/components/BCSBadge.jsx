import { motion } from "framer-motion"
import { Target } from "lucide-react"
import { getBCSRelevance } from "../bcs"


export default function BCSBadge({ relevance, size = "sm" }) {
  if (!relevance || relevance === "skip") return null

  const info = getBCSRelevance(relevance)
  const sizeClasses = size === "lg"
    ? "text-sm px-3 py-1.5 gap-2"
    : "text-[10px] px-2 py-1 gap-1.5"

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center font-bold uppercase tracking-widest rounded-md ${info.color} ${info.text} ${sizeClasses}`}
    >
      <Target className={size === "lg" ? "w-4 h-4" : "w-3 h-3"} strokeWidth={2.5} />
      {info.label}
    </motion.span>
  )
}
