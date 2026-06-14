import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { Target, Filter, ArrowRight, Sparkles } from "lucide-react"
import { BCS_SUBJECTS, getBCSSubject } from "../bcs"
import { getBCSFeed, getBCSStats } from "../api"
import SourceBadge from "../components/SourceBadge"


/**
 * Group articles by story_cluster_id so we don't show the same story
 * three times when Daily Star, Prothom Alo, and TBS all covered it.
 *
 * For each cluster, we keep the highest-BCS-relevance article as the
 * representative, and collect all unique sources for the badge row.
 */
function dedupByCluster(articles) {
  const RELEVANCE_SCORE = { high: 0, medium: 1, low: 2, skip: 3 }
  const byCluster = new Map()
  const singletons = []

  for (const article of articles) {
    const cid = article.story_cluster_id
    if (!cid) {
      singletons.push({ ...article, _sources: [article.source_id] })
      continue
    }
    const existing = byCluster.get(cid)
    if (!existing) {
      byCluster.set(cid, { ...article, _sources: [article.source_id] })
      continue
    }
    // Add source if not already tracked
    if (!existing._sources.includes(article.source_id)) {
      existing._sources.push(article.source_id)
    }
    // Promote to this article if it has higher BCS relevance
    const oldScore = RELEVANCE_SCORE[existing.bcs_relevance] ?? 99
    const newScore = RELEVANCE_SCORE[article.bcs_relevance] ?? 99
    if (newScore < oldScore) {
      byCluster.set(cid, { ...article, _sources: existing._sources })
    }
  }

  const result = [...byCluster.values(), ...singletons]
  result.sort((a, b) => {
    const sa = RELEVANCE_SCORE[a.bcs_relevance] ?? 99
    const sb = RELEVANCE_SCORE[b.bcs_relevance] ?? 99
    if (sa !== sb) return sa - sb
    return new Date(b.scraped_at) - new Date(a.scraped_at)
  })
  return result
}


function BCSArticleCard({ article }) {
  const subjectInfo = getBCSSubject(article.bcs_subject)
  const uniqueSources = article._sources || [article.source_id]

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <Link
        to={`/article/${article.id}`}
        className={`block bg-white rounded-xl border-l-4 ${subjectInfo.accent} border border-brand-navy-100 p-5 hover:shadow-lg transition-all duration-300`}
      >
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {article.bcs_relevance === "high" && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md bg-brand-gold-500 text-brand-navy-950">
              <Target className="w-3 h-3" strokeWidth={2.5} />
              BCS Important
            </span>
          )}
          <span className={`inline-flex items-center text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md ${subjectInfo.light}`}>
            {subjectInfo.label}
          </span>
          {uniqueSources.map((sid) => <SourceBadge key={sid} sourceId={sid} />)}
          {uniqueSources.length > 1 && (
            <span className="text-[10px] uppercase tracking-widest font-bold text-brand-gold-600">
              &middot; {uniqueSources.length} sources
            </span>
          )}
        </div>

        <h3
          lang={article.language}
          className="font-display text-lg font-bold text-brand-navy-900 leading-snug mb-2 line-clamp-2"
        >
          {article.headline}
        </h3>

        {article.summary_en && (
          <p className="text-sm text-brand-navy-500 leading-relaxed line-clamp-2 mb-3">
            {article.summary_en}
          </p>
        )}

        {article.key_facts && article.key_facts.length > 0 && (
          <div className="bg-brand-navy-50 rounded-lg p-3 mb-3">
            <div className="text-[10px] uppercase tracking-widest font-bold text-brand-gold-700 mb-1.5">
              Quick Facts
            </div>
            <ul className="text-xs text-brand-navy-700 space-y-0.5">
              {article.key_facts.slice(0, 3).map((fact, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-brand-gold-600">&#9656;</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold-600">
          Read full article
          <ArrowRight className="w-3 h-3" />
        </div>
      </Link>
    </motion.article>
  )
}


export default function BCSFeedPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const subjectFilter = searchParams.get("subject")
  const [articles, setArticles] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      getBCSFeed({ subject: subjectFilter, limit: 100 }),
      getBCSStats(),
    ])
      .then(([articlesData, statsData]) => {
        // Dedup by story cluster client-side
        const deduped = dedupByCluster(articlesData)
        setArticles(deduped)
        setStats(statsData)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [subjectFilter])

  const subjectList = Object.keys(BCS_SUBJECTS).filter((s) => s !== "not_relevant")
  const subjectCounts = stats?.by_subject || {}
  const totalClassified = stats?.total_classified || 0

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-brand-navy-900 rounded-2xl overflow-hidden mb-8 p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-brand-gold-500/25 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gold-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-brand-navy-950" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-brand-gold-300">
                AI-Curated for BCS Aspirants
              </div>
            </div>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
            BCS News Feed
          </h1>
          <p className="text-sm text-brand-navy-200 max-w-xl mb-3">
            Only articles relevant for BCS and government job exam preparation,
            classified and tagged by AI. Each comes with quick facts for revision.
          </p>
          {totalClassified > 0 && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gold-300">
              <Sparkles className="w-3 h-3" />
              {articles.length} unique stories &middot; {totalClassified} articles analyzed
            </div>
          )}
        </div>
      </motion.div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-brand-navy-500" />
        <button
          onClick={() => setSearchParams({})}
          className={`text-xs uppercase tracking-widest font-bold px-3 py-1.5 rounded-md transition-colors ${
            !subjectFilter
              ? "bg-brand-navy-900 text-brand-gold-300"
              : "bg-brand-navy-50 text-brand-navy-500 hover:bg-brand-navy-100"
          }`}
        >
          All Subjects
        </button>
        {subjectList.map((slug) => {
          const info = BCS_SUBJECTS[slug]
          const active = subjectFilter === slug
          const count = subjectCounts[slug] || 0
          return (
            <button
              key={slug}
              onClick={() => setSearchParams({ subject: slug })}
              className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold px-3 py-1.5 rounded-md transition-colors ${
                active ? `${info.color} ${info.text}` : `${info.light} hover:opacity-80`
              }`}
            >
              {info.label}
              {count > 0 && (
                <span className="text-[10px] opacity-70">({count})</span>
              )}
            </button>
          )
        })}
      </div>

      {loading && (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-brand-navy-200 border-t-brand-gold-500 rounded-full animate-spin" />
          <p className="text-brand-navy-500 mt-4 text-sm">Loading BCS feed...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && articles.length === 0 && totalClassified === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-brand-navy-50 rounded-2xl"
        >
          <Target className="w-12 h-12 text-brand-navy-300 mx-auto mb-3" />
          <p className="font-semibold text-brand-navy-700 text-lg">
            BCS feed is being prepared
          </p>
          <p className="text-sm text-brand-navy-500 mt-2 max-w-md mx-auto">
            AI is analyzing articles for BCS exam relevance. Check back soon.
          </p>
        </motion.div>
      )}

      {!loading && !error && articles.length === 0 && totalClassified > 0 && (
        <div className="text-center py-16 bg-brand-navy-50 rounded-2xl">
          <Target className="w-10 h-10 text-brand-navy-300 mx-auto mb-3" />
          <p className="font-semibold text-brand-navy-600">
            No articles match this filter
          </p>
          <button
            onClick={() => setSearchParams({})}
            className="text-sm font-semibold text-brand-gold-600 hover:underline mt-2"
          >
            Clear filter
          </button>
        </div>
      )}

      {!loading && !error && articles.length > 0 && (
        <div className="space-y-4">
          {articles.map((article) => (
            <BCSArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
