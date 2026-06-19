import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"


export default function StudyShell({ icon: Icon, title, subtitle, action, children }) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link to="/study-space"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-navy-500 hover:text-brand-gold-600 transition-colors mb-4">
        <ArrowLeft className="w-3.5 h-3.5" />
        Study Dashboard
      </Link>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-brand-navy-900 to-brand-navy-800 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-brand-gold-500/20 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-gold-500 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-brand-navy-950" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white leading-tight">{title}</h1>
              {subtitle && <p className="text-sm text-brand-navy-200 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      </motion.div>

      {/* Content */}
      <div>{children}</div>
    </div>
  )
}
