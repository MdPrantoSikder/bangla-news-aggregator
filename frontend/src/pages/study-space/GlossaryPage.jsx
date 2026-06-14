import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { BookMarked, Plus, X, Trash2, Search, ArrowUpDown } from "lucide-react"
import { useStudySpace } from "../../hooks/useStudySpace"
import StudyShell from "../../components/StudyShell"
import { timeAgo } from "../../utils"


function GlossaryCard({ term, onDelete }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-xl border border-brand-navy-100 p-4 flex items-start justify-between gap-3 hover:border-brand-gold-300 transition-colors">
      <div className="flex-1">
        <div className="font-display font-bold text-brand-navy-900 mb-1">{term.term}</div>
        <p className="text-sm text-brand-navy-600 leading-relaxed">{term.definition}</p>
        <p className="text-xs text-brand-navy-400 mt-1">{timeAgo(term.addedAt)}</p>
      </div>
      <button onClick={() => onDelete(term.id)}
        className="p-1.5 rounded-lg text-brand-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}


function AddGlossaryForm({ onAdd, onClose }) {
  const [term, setTerm] = useState("")
  const [definition, setDefinition] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!term.trim() || !definition.trim()) return
    onAdd(term, definition)
    setTerm("")
    setDefinition("")
    onClose()
  }

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-brand-navy-50 rounded-xl p-4 border border-brand-navy-200 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-brand-navy-900">Add New Term</h3>
        <button onClick={onClose} className="text-brand-navy-400 hover:text-brand-navy-700">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input value={term} onChange={(e) => setTerm(e.target.value)}
          placeholder="Term (e.g. Monetary Policy)"
          className="w-full text-sm p-2.5 rounded-lg border border-brand-navy-200 focus:outline-none focus:border-brand-gold-400 bg-white"
          autoFocus />
        <textarea value={definition} onChange={(e) => setDefinition(e.target.value)}
          placeholder="Definition in English or Bangla..." rows={3}
          className="w-full text-sm p-2.5 rounded-lg border border-brand-navy-200 focus:outline-none focus:border-brand-gold-400 resize-none bg-white" />
        <button type="submit" disabled={!term.trim() || !definition.trim()}
          className="w-full py-2 rounded-lg bg-brand-gold-500 text-brand-navy-950 text-sm font-bold hover:bg-brand-gold-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Add Term
        </button>
      </form>
    </motion.div>
  )
}


export default function GlossaryPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState("")
  const [sortMode, setSortMode] = useState("recent")  // "recent" or "alpha"

  const { glossary, addGlossaryTerm, deleteGlossaryTerm } = useStudySpace()

  const filtered = useMemo(() => {
    let list = glossary
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(g =>
        g.term?.toLowerCase().includes(q) ||
        g.definition?.toLowerCase().includes(q)
      )
    }
    if (sortMode === "alpha") {
      list = [...list].sort((a, b) => a.term.localeCompare(b.term))
    }
    return list
  }, [glossary, search, sortMode])

  const action = (
    <button onClick={() => setShowAdd(!showAdd)}
      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-brand-gold-500 text-brand-navy-950 hover:bg-brand-gold-600 transition-colors">
      <Plus className="w-3.5 h-3.5" /> Add Term
    </button>
  )

  return (
    <StudyShell
      icon={BookMarked}
      title="Glossary"
      subtitle={`${glossary.length} term${glossary.length !== 1 ? "s" : ""} in your personal dictionary`}
      action={action}
    >
      {showAdd && <AddGlossaryForm onAdd={addGlossaryTerm} onClose={() => setShowAdd(false)} />}

      {glossary.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy-300" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search terms or definitions..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white text-sm border border-brand-navy-200 focus:outline-none focus:border-brand-gold-400" />
          </div>
          <button
            onClick={() => setSortMode(sortMode === "recent" ? "alpha" : "recent")}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-lg bg-white border border-brand-navy-200 text-brand-navy-700 hover:border-brand-gold-400 transition-colors"
            title="Toggle sort"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortMode === "recent" ? "Recent" : "A-Z"}
          </button>
        </div>
      )}

      {glossary.length === 0 && !showAdd ? (
        <div className="text-center py-16 bg-brand-navy-50 rounded-2xl">
          <BookMarked className="w-10 h-10 text-brand-navy-300 mx-auto mb-3" />
          <p className="font-semibold text-brand-navy-600">Your glossary is empty</p>
          <p className="text-sm text-brand-navy-400 mt-1 max-w-sm mx-auto">
            Add important BCS terms with definitions in English or Bangla. Like your personal dictionary.
          </p>
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold px-4 py-2 rounded-lg bg-brand-gold-500 text-brand-navy-950 hover:bg-brand-gold-600">
            <Plus className="w-4 h-4" /> Add First Term
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-brand-navy-50 rounded-2xl">
          <Search className="w-10 h-10 text-brand-navy-300 mx-auto mb-3" />
          <p className="font-semibold text-brand-navy-600">No results for "{search}"</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(term => (
              <GlossaryCard key={term.id} term={term} onDelete={deleteGlossaryTerm} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Help footer */}
      <div className="mt-8 p-4 bg-brand-navy-50 rounded-xl text-xs text-brand-navy-500 leading-relaxed">
        <p className="font-bold text-brand-navy-700 mb-1">Glossary tips:</p>
        <ul className="space-y-1">
          <li>&middot; Add hard English terms (e.g. "Monetary Policy") with Bangla definitions</li>
          <li>&middot; Use the A-Z sort to revise alphabetically before exams</li>
          <li>&middot; Search finds matches in both terms and definitions</li>
        </ul>
      </div>
    </StudyShell>
  )
}
