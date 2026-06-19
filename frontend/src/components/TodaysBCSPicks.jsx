import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { GraduationCap, ArrowRight, Bookmark, BookOpen } from "lucide-react"
import { getBCSFeed } from "../api"
import SourceBadge from "./SourceBadge"


// BCS subject slug → display label + BCS exam paper context
const SUBJECT_META = {
  bangladesh_affairs: { label: "Bangladesh Affairs", paper: "GS Paper I" },
  international:      { label: "International",      paper: "GS Paper II" },
  economy:            { label: "Economy",            paper: "GS Paper III" },
  science_tech:       { label: "Science & Tech",     paper: "GS Paper III" },
  geography:          { label: "Geography",          paper: "GS Paper I" },
  history_culture:    { label: "History & Culture",  paper: "GS Paper I" },
  current_affairs:    { label: "Current Affairs",    paper: "Daily Prep" },
}


// Formatted date like "27 May"
function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}


// =============================================================================
// HERO CARD - the top pick, gets full visual weight
// =============================================================================
function HeroPick({ article }) {
  if (!article) return null

  const summary = article.summary_en || article.summary_bn
  const facts = (article.key_facts || []).slice(0, 3)
  const meta = SUBJECT_META[article.bcs_subject] || { label: article.bcs_subject, paper: "" }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="md:col-span-2 md:row-span-2"
    >
      <Link
        to={`/article/${article.id}`}
        className="group relative block h-full bg-white rounded-2xl overflow-hidden border-2 border-brand-gold-200 hover:border-brand-gold-400 shadow-md hover:shadow-xl transition-all duration-500"
      >
        {article.image_url && (
          <div className="relative aspect-[16/9] overflow-hidden bg-brand-navy-100">
            <img
              src={article.image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
              onError={(e) => { e.target.parentElement.style.display = "none" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-950/70 via-brand-navy-900/20 to-transparent" />

            {/* Top-left "Editor's Pick" ribbon */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-brand-gold-500 text-brand-navy-950 px-3 py-1 rounded-md shadow-md">
              <GraduationCap className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="text-[10px] uppercase tracking-widest font-bold">
                Editor&apos;s Pick
              </span>
            </div>

            {/* Bottom-left: subject + paper context on the image */}
            <div className="absolute bottom-4 left-5 right-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-gold-300">
                  {meta.label}
                </span>
                {meta.paper && (
                  <>
                    <span className="text-brand-gold-400/60">·</span>
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-white/80">
                      {meta.paper}
                    </span>
                  </>
                )}
              </div>
              <h2
                lang={article.language}
                className="font-display text-xl md:text-2xl font-bold text-white leading-tight line-clamp-2"
              >
                {article.headline}
              </h2>
            </div>
          </div>
        )}

        <div className="p-6">
          {summary && (
            <p
              lang={article.language}
              className="text-sm text-brand-navy-700 leading-relaxed line-clamp-2 mb-5"
            >
              {summary}
            </p>
          )}

          {facts.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-3">
                <BookOpen className="w-3.5 h-3.5 text-brand-gold-600" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-brand-gold-600">
                  Key Facts
                </span>
              </div>
              <ol className="space-y-2">
                {facts.map((fact, i) => (
                  <li
                    key={i}
                    lang={article.language}
                    className="text-xs text-brand-navy-800 leading-relaxed flex gap-2.5"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-gold-100 text-brand-gold-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-brand-navy-100">
            <div className="flex items-center gap-2">
              <SourceBadge sourceId={article.source_id} />
              <span className="text-[10px] text-brand-navy-400 uppercase tracking-wider">
                {formatDate(article.scraped_at)}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold-600 group-hover:text-brand-gold-700">
              Study this
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}


// =============================================================================
// COMPACT PICK - the 4 supporting cards
// =============================================================================
function CompactPick({ article, index }) {
  if (!article) return null

  const facts = (article.key_facts || []).slice(0, 2)
  const meta = SUBJECT_META[article.bcs_subject] || { label: article.bcs_subject, paper: "" }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.05, ease: "easeOut" }}
    >
      <Link
        to={`/article/${article.id}`}
        className="group relative block h-full bg-white rounded-xl p-4 border border-brand-navy-100 hover:border-brand-gold-300 shadow-sm hover:shadow-md transition-all duration-300"
      >
        {/* Subject + paper tag */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] uppercase tracking-widest font-bold text-brand-gold-600">
            {meta.label}
          </span>
          {meta.paper && (
            <>
              <span className="text-brand-navy-300">·</span>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-brand-navy-500">
                {meta.paper}
              </span>
            </>
          )}
        </div>

        <h3
          lang={article.language}
          className="font-display text-sm font-bold text-brand-navy-900 leading-snug mb-3 line-clamp-2 group-hover:text-brand-navy-700 transition-colors"
        >
          {article.headline}
        </h3>

        {facts.length > 0 && (
          <ul className="space-y-1.5 mb-3 pb-3 border-b border-brand-navy-100">
            {facts.map((fact, i) => (
              <li
                key={i}
                lang={article.language}
                className="text-[11px] text-brand-navy-700 leading-snug flex gap-1.5"
              >
                <span className="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-brand-gold-100 text-brand-gold-700 text-[9px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="line-clamp-2">{fact}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between">
          <SourceBadge sourceId={article.source_id} />
          <span className="text-[10px] text-brand-navy-400 uppercase tracking-wider">
            {formatDate(article.scraped_at)}
          </span>
        </div>
      </Link>
    </motion.div>
  )
}


// =============================================================================
// SECTION
// =============================================================================
export default function TodaysBCSPicks({ language = null }) {
  const [picks, setPicks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getBCSFeed({ limit: 8 })
      .then((data) => {
        const filtered = language ? data.filter((a) => a.language === language) : data
        setPicks(filtered.slice(0, 5))
        setLoading(false)
      })
      .catch((err) => {
        console.error("BCS feed fetch failed:", err)
        setLoading(false)
      })
  }, [language])

  if (loading) {
    return (
      <section className="mb-12">
        <div className="h-96 bg-brand-navy-50 rounded-3xl animate-pulse" />
      </section>
    )
  }

  if (picks.length === 0) return null

  const [hero, ...rest] = picks
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric"
  })

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="mb-12 relative"
    >
      {/* Premium cream/gold panel container */}
      <div className="relative rounded-3xl bg-gradient-to-br from-brand-gold-50/60 via-amber-50/40 to-orange-50/30 border-2 border-brand-gold-200/60 p-6 md:p-8 shadow-sm overflow-hidden">

        {/* Decorative top-right gold corner */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-brand-gold-300/30 via-brand-gold-200/10 to-transparent pointer-events-none rounded-tr-3xl" />

        {/* Decorative bottom-left subtle ornament */}
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-brand-gold-200/20 to-transparent pointer-events-none rounded-bl-3xl" />

        {/* Header bar — like a textbook chapter heading */}
        <div className="relative flex items-end justify-between mb-6 pb-4 border-b-2 border-brand-gold-200/60">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-brand-gold-500 text-brand-navy-950 flex items-center justify-center shadow-sm">
                <GraduationCap className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-brand-gold-700">
                Study Pack
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-navy-900 leading-tight">
              Today&apos;s BCS Picks
            </h2>
            <p className="text-xs text-brand-navy-600 mt-1">
              Curated news for civil service exam preparation · {today}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-brand-gold-200">
            <Bookmark className="w-3.5 h-3.5 text-brand-gold-600" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-navy-700">
              {picks.length} articles
            </span>
          </div>
        </div>

        {/* Grid: hero + 4 compact */}
        <div className="relative grid md:grid-cols-3 gap-4">
          <HeroPick article={hero} />
          <div className="md:col-span-1 grid grid-cols-1 gap-4">
            {rest.slice(0, 2).map((a, i) => (
              <CompactPick key={a.id} article={a} index={i} />
            ))}
          </div>
          {rest.slice(2, 4).map((a, i) => (
            <CompactPick key={a.id} article={a} index={i + 2} />
          ))}
        </div>
      </div>
    </motion.section>
  )
}
