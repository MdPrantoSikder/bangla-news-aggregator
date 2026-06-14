import { useEffect, useState, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ExternalLink, Clock, Highlighter, Target, X } from "lucide-react"
import { getArticle } from "../api"
import SourceBadge from "../components/SourceBadge"
import LangBadge from "../components/LangBadge"
import SaveButton from "../components/SaveButton"
import { useStudySpace } from "../hooks/useStudySpace"
import { timeAgo, CATEGORY_LABEL } from "../utils"
import { getBCSSubject } from "../bcs"


function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handler = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? (window.scrollY / total) * 100 : 0)
    }
    window.addEventListener("scroll", handler, { passive: true })
    handler()
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-50 pointer-events-none">
      <div className="h-full bg-brand-gold-500 transition-all duration-150" style={{ width: `${progress}%` }} />
    </div>
  )
}


function HighlightTooltip({ position, onSave, onDismiss }) {
  if (!position) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{ top: position.top, left: position.left }}
      className="fixed z-50 flex items-center gap-1 bg-white border-2 border-brand-gold-500 rounded-lg shadow-xl p-1"
    >
      <button
        onMouseDown={(e) => { e.preventDefault(); onSave() }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 transition-colors"
      >
        <Highlighter className="w-3.5 h-3.5" />
        Save as Key Point
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); onDismiss() }}
        className="p-1.5 text-brand-navy-400 hover:text-white transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  )
}


function KeyFactsCard({ facts, bcs_subject }) {
  const subjectInfo = getBCSSubject(bcs_subject)
  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`relative rounded-2xl p-6 mb-10 border-l-4 ${subjectInfo.accent} border border-brand-navy-100 bg-white`}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md bg-brand-gold-500 text-brand-navy-950">
          <Target className="w-3 h-3" strokeWidth={2.5} />
          BCS Quick Facts
        </div>
        <span className={`inline-flex items-center text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md ${subjectInfo.light}`}>
          {subjectInfo.label}
        </span>
      </div>
      <ul className="space-y-2">
        {facts.map((fact, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.06 }}
            className="flex items-start gap-3"
          >
            <span className="flex-shrink-0 w-5 h-5 bg-brand-gold-100 text-brand-navy-900 text-[10px] font-bold rounded flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span className="text-sm text-brand-navy-800 leading-relaxed">{fact}</span>
          </motion.li>
        ))}
      </ul>
    </motion.aside>
  )
}


function ArticlePage() {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selection, setSelection] = useState(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const bodyRef = useRef(null)
  const { addKeyPoint } = useStudySpace()

  useEffect(() => {
    setLoading(true)
    setError(null)
    window.scrollTo(0, 0)
    getArticle(id)
      .then((data) => { setArticle(data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [id])

  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection()
      const text = sel?.toString().trim()
      console.log("mouseup fired, text:", text) 
      if (!text || text.length < 5) { setSelection(null); return }
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      setSelection({
        text,
        position: {
          top: rect.top - 48,
          left: Math.max(8, rect.left + rect.width / 2 - 110),
        },
      })
    }
    document.addEventListener("mouseup", handleMouseUp)
    return () => document.removeEventListener("mouseup", handleMouseUp)
  }, [])

  const handleSaveKeyPoint = () => {
    if (!selection || !article) return
    addKeyPoint(article.id, article.headline, selection.text)
    setSelection(null)
    window.getSelection()?.removeAllRanges()
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  if (loading) return (
    <div className="text-center py-20">
      <div className="inline-block w-8 h-8 border-2 border-brand-navy-200 border-t-brand-gold-500 rounded-full animate-spin" />
      <p className="text-brand-navy-500 mt-4 text-sm">Loading article...</p>
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
      <strong>Error:</strong> {error}
    </div>
  )
  if (!article) return null

  const wordCount = article.body ? article.body.split(/\s+/).length : 0
  const readingMin = Math.max(1, Math.round(wordCount / (article.language === "bn" ? 120 : 200)))
  const hasBCSData = article.bcs_relevance && article.bcs_relevance !== "skip"

  return (
    <>
      <ReadingProgress />

      <AnimatePresence>
        {selection && (
          <HighlightTooltip
            position={selection.position}
            onSave={handleSaveKeyPoint}
            onDismiss={() => setSelection(null)}
          />
        )}
      </AnimatePresence>

      {savedFlash && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-brand-navy-900 text-brand-gold-400 text-sm font-bold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2"
        >
          <Highlighter className="w-4 h-4" />
          Key point saved!
        </motion.div>
      )}

      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-navy-500 hover:text-brand-navy-900 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back home
          </Link>
          {article && <SaveButton article={article} size="lg" />}
        </div>

        {/* Meta badges */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex items-center gap-2 mb-5 flex-wrap"
        >
          <SourceBadge sourceId={article.source_id} size="lg" />
          {article.category && (
            <Link
              to={`/category/${article.category}`}
              className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-1.5 rounded-md bg-brand-navy-50 text-brand-navy-700 hover:bg-brand-navy-100 transition-colors"
            >
              {CATEGORY_LABEL[article.category] || article.category}
            </Link>
          )}
          {article.bcs_relevance === "high" && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1.5 rounded-md bg-brand-gold-500 text-brand-navy-950">
              <Target className="w-3 h-3" strokeWidth={2.5} />
              BCS Important
            </span>
          )}
          <LangBadge language={article.language} />
        </motion.div>

        {/* Headline */}
        <motion.h1
          lang={article.language}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-3xl md:text-5xl font-bold text-brand-navy-900 leading-[1.15] tracking-tight mb-6"
        >
          {article.headline}
        </motion.h1>

        {/* Meta line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex items-center gap-4 text-sm text-brand-navy-500 mb-8 pb-6 border-b border-brand-navy-100 flex-wrap"
        >
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{timeAgo(article.scraped_at)}</span>
          </div>
          <div className="w-1 h-1 bg-brand-navy-300 rounded-full" />
          <span>{readingMin} min read</span>
          <div className="w-1 h-1 bg-brand-navy-300 rounded-full" />
          <span>{wordCount.toLocaleString()} words</span>
          <div className="w-1 h-1 bg-brand-navy-300 rounded-full hidden sm:block" />
          <span className="hidden sm:flex items-center gap-1 text-brand-gold-600 font-semibold text-xs">
            <Highlighter className="w-3.5 h-3.5" />
            Select text to save key points
          </span>
        </motion.div>

        {/* Hero image */}
        {article.image_url && (
          <motion.figure
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-10 -mx-4 md:mx-0"
          >
            <div className="rounded-2xl overflow-hidden bg-brand-navy-50 shadow-md">
              <img
                src={article.image_url}
                alt={article.headline}
                className="w-full h-auto"
                onError={(e) => { e.target.parentElement.parentElement.style.display = "none" }}
              />
            </div>
          </motion.figure>
        )}

        {/* BCS Key Facts — shown above summary when present */}
        {hasBCSData && article.key_facts && article.key_facts.length > 0 && (
          <KeyFactsCard facts={article.key_facts} bcs_subject={article.bcs_subject} />
        )}

        {/* AI Summary */}
        {(article.summary_en || article.summary_bn) && (
          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="relative bg-gradient-to-br from-brand-navy-50 to-brand-gold-50 rounded-2xl p-6 mb-10 border border-brand-gold-100"
          >
            <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md bg-brand-navy-900 text-brand-gold-300">
              <span className="w-1.5 h-1.5 bg-brand-gold-500 rounded-full animate-pulse" />
              AI Summary
            </div>
            <div className="space-y-3 mt-2">
              {article.summary_en && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-brand-navy-500 mb-1">English</div>
                  <p className="text-sm text-brand-navy-900 leading-relaxed">{article.summary_en}</p>
                </div>
              )}
              {article.summary_bn && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-brand-navy-500 mb-1">বাংলা</div>
                  <p lang="bn" className="text-sm text-brand-navy-900 leading-relaxed">{article.summary_bn}</p>
                </div>
              )}
            </div>
          </motion.aside>
        )}

        {/* Article body — select text to highlight */}
        <motion.div
          ref={bodyRef}
          lang={article.language}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="article-prose text-brand-ink whitespace-pre-wrap text-[1.08rem] leading-[1.85] select-text cursor-text"
        >
          {article.body}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-12 pt-8 border-t border-brand-navy-100"
        >
          <div className="bg-brand-navy-50 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-brand-navy-500 mb-1">Originally published on</div>
              <SourceBadge sourceId={article.source_id} />
            </div>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-navy-900 hover:text-brand-gold-700 transition-colors"
            >
              Read original
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </motion.article>
    </>
  )
}

export default ArticlePage







