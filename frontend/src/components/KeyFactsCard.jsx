import { motion } from "framer-motion"
import { Lightbulb, BookmarkPlus } from "lucide-react"


export default function KeyFactsCard({ facts }) {
  if (!facts || facts.length === 0) return null

  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative bg-white rounded-2xl border-2 border-brand-gold-300 p-6 mb-10 shadow-sm overflow-hidden"
    >
      {/* Floating "BCS Key Facts" header badge */}
      <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md bg-brand-navy-900 text-brand-gold-300">
        <Lightbulb className="w-3 h-3" strokeWidth={2.5} />
        BCS Key Facts
      </div>

      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-gold-100/50 to-transparent pointer-events-none" />

      <div className="relative">
        <p className="text-xs text-brand-navy-500 mb-4 mt-1">
          Important facts extracted from this article for your BCS revision.
        </p>

        <ul className="space-y-2.5">
          {facts.map((fact, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.06 }}
              className="flex items-start gap-3 group"
            >
              <span className="flex-shrink-0 w-6 h-6 bg-brand-gold-500 text-brand-navy-950 text-xs font-bold rounded-md flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-brand-navy-900 leading-relaxed flex-1">
                {fact}
              </span>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-brand-navy-400 hover:text-brand-gold-600"
                title="Save to my key facts"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.aside>
  )
}
