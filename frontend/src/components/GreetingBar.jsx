import { motion } from "framer-motion"
import { Clock } from "lucide-react"
import { useTimeSpent } from "../hooks/useTimeSpent"

function getGreeting(hour) {
  if (hour < 5) return "Good night"
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  if (hour < 21) return "Good evening"
  return "Good night"
}

export default function GreetingBar() {
  const now = new Date()
  const greeting = getGreeting(now.getHours())
  const timeSpent = useTimeSpent()

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex items-end justify-between pb-5 mb-6 border-b border-brand-navy-100"
    >
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-brand-navy-900 tracking-tight">
          {greeting}.
        </h1>
        <p className="text-sm text-brand-navy-500 mt-1">
          {dateStr} &middot; Here's what matters today
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-brand-gold-600">
        <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
        <span>Today: {timeSpent}</span>
      </div>
    </motion.div>
  )
}
