import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Highlighter, Trash2, Search } from "lucide-react"
import { useStudySpace } from "../../hooks/useStudySpace"
import StudyShell from "../../components/StudyShell"
import { timeAgo } from "../../utils"


function KeyPointCard({ kp, onDelete }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-xl border-l-4 border-l-brand-gold-500 border border-brand-navy-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-brand-navy-900 font-medium leading-relaxed mb-2">
            "{kp.text}"
          </p>
          <Link to={`/article/${kp.articleId}`}
            className="text-xs text-brand-gold-600 hover:underline font-semibold">
            {kp.articleHeadline?.slice(0, 70)}{kp.articleHeadline && kp.articleHeadline.length > 70 ? "..." : ""}
          </Link>
          <p className="text-xs text-brand-navy-400 mt-1">{timeAgo(kp.savedAt)}</p>
        </div>
        <button onClick={() => onDelete(kp.id)}
          className="p-1.5 rounded-lg text-brand-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}


export default function KeyPointsPage() {
  const [search, setSearch] = useState("")
  const { keyPoints, deleteKeyPoint } = useStudySpace()

  const filtered = useMemo(() => {
    if (!search.trim()) return keyPoints
    const q = search.toLowerCase()
    return keyPoints.filter(kp =>
      kp.text?.toLowerCase().includes(q) ||
      kp.articleHeadline?.toLowerCase().includes(q)
    )
  }, [keyPoints, search])

  return (
    <StudyShell
      icon={Highlighter}
      title="Key Points"
      subtitle={`${keyPoints.length} highlight${keyPoints.length !== 1 ? "s" : ""} saved`}
    >
      {/* Search */}
      {keyPoints.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy-300" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search highlights..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white text-sm border border-brand-navy-200 focus:outline-none focus:border-brand-gold-400" />
        </div>
      )}

      {keyPoints.length === 0 ? (
        <div className="text-center py-16 bg-brand-navy-50 rounded-2xl">
          <Highlighter className="w-10 h-10 text-brand-navy-300 mx-auto mb-3" />
          <p className="font-semibold text-brand-navy-600">No key points saved yet</p>
          <p className="text-sm text-brand-navy-400 mt-1 max-w-sm mx-auto">
            Open any article, select important text with your mouse,
            then click "Save as Key Point"
          </p>
          <Link to="/" className="inline-block mt-4 text-sm font-semibold text-brand-gold-600 hover:underline">
            Browse articles &rarr;
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-brand-navy-50 rounded-2xl">
          <Search className="w-10 h-10 text-brand-navy-300 mx-auto mb-3" />
          <p className="font-semibold text-brand-navy-600">No results for "{search}"</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(kp => (
              <KeyPointCard key={kp.id} kp={kp} onDelete={deleteKeyPoint} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Help footer */}
      <div className="mt-8 p-4 bg-brand-navy-50 rounded-xl text-xs text-brand-navy-500 leading-relaxed">
        <p className="font-bold text-brand-navy-700 mb-1">How to use:</p>
        <p>Open any article &rarr; select important text with your mouse &rarr; a gold "Save as Key Point" tooltip appears &rarr; click to save here.</p>
      </div>
    </StudyShell>
  )
}
