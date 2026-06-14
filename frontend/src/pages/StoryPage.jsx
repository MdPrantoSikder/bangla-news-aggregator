import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Sparkles, Layers, ArrowRight } from "lucide-react"
import { getStory } from "../api"
import SourceBadge from "../components/SourceBadge"
import LangBadge from "../components/LangBadge"
import { timeAgo, CATEGORY_LABEL } from "../utils"


function StoryPage() {
  const { id } = useParams()
  const [story, setStory] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    window.scrollTo(0, 0)
    getStory(id)
      .then((data) => {
        setStory(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-8 h-8 border-2 border-brand-navy-200 border-t-brand-gold-500 rounded-full animate-spin" />
        <p className="text-brand-navy-500 mt-4 text-sm">Loading story...</p>
      </div>
    )
  }

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
      <strong>Error:</strong> {error}
    </div>
  )
  if (!story) return null

  const firstWithSummary = story.articles.find((a) => a.summary_en || a.summary_bn)
  const summary = firstWithSummary && (firstWithSummary.summary_en || firstWithSummary.summary_bn)
  const heroArticle = story.articles.find((a) => a.image_url) || story.articles[0]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-navy-500 hover:text-brand-navy-900 transition-colors group mb-6"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back home
      </Link>

      {/* Hero section with gradient */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-brand-navy-900 rounded-2xl overflow-hidden mb-8 shadow-lg"
      >
        {/* Gold accent corner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-brand-gold-500/25 via-brand-gold-500/5 to-transparent pointer-events-none" />

        {/* Featured badge */}
        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md bg-brand-gold-500 text-brand-navy-950">
              <Sparkles className="w-3 h-3" strokeWidth={2.5} />
              Featured Story
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md bg-white/10 text-brand-gold-300">
              <Layers className="w-3 h-3" />
              {story.article_count} {story.article_count === 1 ? "source" : "sources"} covered
            </span>
          </div>

          <h1
            lang={story.articles[0].language}
            className="font-display text-3xl md:text-4xl font-bold text-white leading-tight mb-3"
          >
            {story.articles[0].headline}
          </h1>

          <p className="text-sm text-brand-navy-200">
            Clustered {timeAgo(story.created_at)}
          </p>

          {/* AI Summary inside hero */}
          {summary && (
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-brand-gold-300 mb-2">
                <span className="w-1.5 h-1.5 bg-brand-gold-500 rounded-full animate-pulse" />
                AI Summary
              </div>
              {firstWithSummary.summary_en && (
                <p className="text-sm text-brand-navy-100 leading-relaxed mb-2">
                  {firstWithSummary.summary_en}
                </p>
              )}
              {firstWithSummary.summary_bn && (
                <p lang="bn" className="text-sm text-brand-navy-100 leading-relaxed">
                  {firstWithSummary.summary_bn}
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex items-baseline gap-3 mb-5"
      >
        <Layers className="w-4 h-4 text-brand-gold-500" />
        <h2 className="text-xs font-bold tracking-widest uppercase text-brand-navy-900">
          All Sources
        </h2>
        <span className="text-xs text-brand-navy-500">
          Same story, multiple perspectives
        </span>
      </motion.div>

      {/* Article cards */}
      <div className="space-y-4">
        {story.articles.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 + i * 0.06 }}
          >
            <Link
              to={`/article/${a.id}`}
              className="group flex gap-4 bg-white p-4 rounded-xl border border-brand-navy-100 hover:border-brand-gold-300 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Image thumbnail */}
              {a.image_url && (
                <div className="w-32 h-32 sm:w-40 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-brand-navy-50 relative">
                  <img
                    src={a.image_url}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.parentElement.style.display = "none" }}
                  />
                </div>
              )}

              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <SourceBadge sourceId={a.source_id} />
                  <LangBadge language={a.language} />
                  {a.category && (
                    <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-brand-navy-50 text-brand-navy-700">
                      {CATEGORY_LABEL[a.category] || a.category}
                    </span>
                  )}
                  <span className="text-xs text-brand-navy-400 ml-auto">
                    {timeAgo(a.scraped_at)}
                  </span>
                </div>

                <h3
                  lang={a.language}
                  className="font-display font-bold text-brand-navy-900 leading-snug group-hover:text-brand-navy-700 transition-colors line-clamp-2 mb-2"
                >
                  {a.headline}
                </h3>

                {(a.summary_en || a.summary_bn) && (
                  <p
                    lang={a.language}
                    className="text-sm text-brand-navy-500 line-clamp-2 leading-relaxed mb-2"
                  >
                    {a.summary_en || a.summary_bn}
                  </p>
                )}

                <div className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-gold-600 group-hover:text-brand-gold-700">
                  Read full version
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default StoryPage
