import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bookmark, Trash2, ExternalLink, ChevronDown, ChevronUp, Calendar,
  Folder, Search, X, Check
} from "lucide-react"
import { useStudySpace } from "../../hooks/useStudySpace"
import SourceBadge from "../../components/SourceBadge"
import StudyShell from "../../components/StudyShell"
import { CATEGORY_LABEL } from "../../utils"


function getDateLabel(dateStr) {
  const saved = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (saved.toDateString() === today.toDateString()) return "Today"
  if (saved.toDateString() === yesterday.toDateString()) return "Yesterday"
  return saved.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
}

function groupByDate(articles) {
  const groups = {}
  for (const a of articles) {
    const key = new Date(a.savedAt).toDateString()
    if (!groups[key]) groups[key] = { label: getDateLabel(a.savedAt), articles: [] }
    groups[key].articles.push(a)
  }
  return Object.values(groups)
}

function buildFolderPath(folders, folderId) {
  if (!folderId) return ""
  const parts = []
  let current = folders.find(f => f.id === folderId)
  while (current) {
    parts.unshift(current.name)
    current = current.parentId ? folders.find(f => f.id === current.parentId) : null
  }
  return parts.join(" / ")
}


function SavedArticleCard({ article, onDelete, onUpdateNote, folders, onMoveToFolder }) {
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState(article.note || "")
  const [editing, setEditing] = useState(false)
  const [showFolderPicker, setShowFolderPicker] = useState(false)

  const saveNote = () => { onUpdateNote(article.id, note); setEditing(false) }
  const currentFolder = folders.find(f => f.id === article.folderId)
  const currentPath = buildFolderPath(folders, article.folderId)

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-xl border border-brand-navy-100 overflow-hidden">
      <div className="flex gap-3 p-4">
        {article.image_url && (
          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-brand-navy-50">
            <img src={article.image_url} alt="" className="w-full h-full object-cover"
              onError={(e) => { e.target.parentElement.style.display = "none" }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <SourceBadge sourceId={article.source_id} />
              {article.category && (
                <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-brand-navy-50 text-brand-navy-700">
                  {CATEGORY_LABEL[article.category] || article.category}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Link to={`/article/${article.id}`} className="p-1.5 rounded-lg text-brand-navy-400 hover:text-brand-navy-700 hover:bg-brand-navy-50">
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button onClick={() => onDelete(article.id)} className="p-1.5 rounded-lg text-brand-navy-400 hover:text-red-600 hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <h3 lang={article.language} className="font-display font-bold text-brand-navy-900 leading-snug line-clamp-2 text-sm mb-1">
            {article.headline}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-brand-navy-400">
              {new Date(article.savedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
            {currentFolder && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gold-100 text-brand-gold-700 font-semibold flex items-center gap-1">
                <Folder className="w-2.5 h-2.5" />{currentPath}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-brand-navy-50 px-4 py-2 flex items-center gap-3">
        <button onClick={() => setShowNote(!showNote)}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy-500 hover:text-brand-navy-800">
          {showNote ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {article.note ? "My note" : "Add note"}
          {article.note && <span className="w-1.5 h-1.5 bg-brand-gold-500 rounded-full" />}
        </button>

        {folders.length > 0 && (
          <div className="relative ml-auto">
            <button onClick={() => setShowFolderPicker(!showFolderPicker)}
              className="flex items-center gap-1 text-xs font-semibold text-brand-navy-400 hover:text-brand-navy-700">
              <Folder className="w-3 h-3" />{currentFolder ? "Move" : "Add to folder"}
            </button>
            {showFolderPicker && (
              <div className="absolute right-0 bottom-7 bg-white border border-brand-navy-200 rounded-xl shadow-xl z-20 min-w-[200px] max-h-60 overflow-y-auto">
                <div className="py-1">
                  {folders.map(f => (
                    <button key={f.id}
                      onClick={() => { onMoveToFolder(article.id, f.id); setShowFolderPicker(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-brand-navy-50 text-brand-navy-700 text-left">
                      <Folder className="w-3 h-3 text-brand-gold-500 flex-shrink-0" />
                      <span className="truncate">{buildFolderPath(folders, f.id)}</span>
                      {article.folderId === f.id && <Check className="w-3 h-3 ml-auto text-brand-gold-500" />}
                    </button>
                  ))}
                  {article.folderId && (
                    <button onClick={() => { onMoveToFolder(article.id, null); setShowFolderPicker(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 text-red-500 border-t border-brand-navy-100">
                      <X className="w-3 h-3" /> Remove from folder
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNote && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-4 pb-3">
            {editing ? (
              <div>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3}
                  placeholder="Write your note..." autoFocus
                  className="w-full text-sm p-2 rounded-lg border border-brand-navy-200 focus:outline-none focus:border-brand-gold-400 resize-none text-brand-ink" />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-brand-navy-400">{note.length}/500</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setNote(article.note || ""); setEditing(false) }}
                      className="text-xs px-2 py-1 rounded text-brand-navy-500 hover:bg-brand-navy-50">Cancel</button>
                    <button onClick={saveNote}
                      className="text-xs px-3 py-1 rounded bg-brand-gold-500 text-brand-navy-950 font-semibold hover:bg-brand-gold-600">Save</button>
                  </div>
                </div>
              </div>
            ) : (
              <div onClick={() => setEditing(true)}
                className="text-sm text-brand-navy-600 cursor-text min-h-[2rem] p-2 rounded-lg hover:bg-brand-navy-50">
                {article.note || <span className="text-brand-navy-300 italic">Click to add a note...</span>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}


function DateSection({ label, articles, onDelete, onUpdateNote, folders, onMoveToFolder }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mb-4">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 py-2 px-3 rounded-xl bg-brand-navy-50 hover:bg-brand-navy-100 mb-2">
        <Calendar className="w-4 h-4 text-brand-gold-500" />
        <span className="font-bold text-sm text-brand-navy-900">{label}</span>
        <span className="text-xs text-brand-navy-400">{articles.length} article{articles.length !== 1 ? "s" : ""}</span>
        <span className="ml-auto">
          {open ? <ChevronUp className="w-4 h-4 text-brand-navy-400" /> : <ChevronDown className="w-4 h-4 text-brand-navy-400" />}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden pl-2">
            {articles.map(a => (
              <SavedArticleCard key={a.id} article={a} onDelete={onDelete}
                onUpdateNote={onUpdateNote} folders={folders} onMoveToFolder={onMoveToFolder} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


export default function SavedPage() {
  const [search, setSearch] = useState("")
  const { savedArticles, folders, unsaveArticle, updateArticleNote, moveToFolder } = useStudySpace()

  const filtered = useMemo(() => {
    if (!search.trim()) return savedArticles
    const q = search.toLowerCase()
    return savedArticles.filter(a => a.headline?.toLowerCase().includes(q))
  }, [savedArticles, search])

  const groups = groupByDate(filtered)

  return (
    <StudyShell icon={Bookmark} title="Saved Articles" subtitle={`${savedArticles.length} total &middot; organized by date`}>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy-300" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your saved articles..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white text-sm border border-brand-navy-200 focus:outline-none focus:border-brand-gold-400" />
      </div>

      {savedArticles.length === 0 ? (
        <div className="text-center py-16 bg-brand-navy-50 rounded-2xl">
          <Bookmark className="w-10 h-10 text-brand-navy-300 mx-auto mb-3" />
          <p className="font-semibold text-brand-navy-600">No saved articles yet</p>
          <Link to="/" className="inline-block mt-3 text-sm font-semibold text-brand-gold-600 hover:underline">
            Browse articles &rarr;
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-brand-navy-50 rounded-2xl">
          <Search className="w-10 h-10 text-brand-navy-300 mx-auto mb-3" />
          <p className="font-semibold text-brand-navy-600">No results for "{search}"</p>
        </div>
      ) : (
        <div>
          {groups.map(g => (
            <DateSection key={g.label} label={g.label} articles={g.articles}
              onDelete={unsaveArticle} onUpdateNote={updateArticleNote}
              folders={folders} onMoveToFolder={moveToFolder} />
          ))}
        </div>
      )}
    </StudyShell>
  )
}
