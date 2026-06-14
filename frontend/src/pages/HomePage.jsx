import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, Newspaper } from "lucide-react"
import { listStories, listArticles, getCategoryStats } from "../api"
import ArticleCard from "../components/ArticleCard"
import StoryCard from "../components/StoryCard"
import LanguageTabs from "../components/LanguageTabs"
import GreetingBar from "../components/GreetingBar"
import FeaturedStories from "../components/FeaturedStories"
import TodaysBCSPicks from "../components/TodaysBCSPicks"
import CategoryGrid from "../components/CategoryGrid"


const SOURCE_ORDER = [1, 2, 6]


/**
 * Pick 3 lead articles for the featured row, one from each source if possible.
 * (Featured can prefer source diversity since it's visual variety.)
 */
function pickFeaturedArticles(articles, count = 3) {
  const SOURCE_ORDER = [1, 2, 6]  // Daily Star, Prothom Alo, TBS
  const HIDDEN_CATEGORIES = ["lifestyle", "opinion", "entertainment", "sports"]

  const score = (a) => {
  const hasSummary = (a.summary_en || a.summary_bn) ? 0 : 10  // big penalty for no summary
  const rel = a.bcs_relevance
   let relScore
   if (rel === "high")   relScore = 0
   else if (rel === "medium") relScore = 1
   else if (!rel)             relScore = 2
   else if (rel === "low")    relScore = 3
   else if (rel === "skip")   relScore = 4
   else relScore = 5
   return hasSummary + relScore
 }

  // For a single source: pick its best article that is NOT lifestyle/opinion/skip
  const bestFromSource = (sourceId) => {
    const candidates = articles
      .filter((a) => a.source_id === sourceId)
      .filter((a) => a.image_url)
      .filter((a) => a.bcs_relevance !== "skip")
      .filter((a) => !HIDDEN_CATEGORIES.includes(a.category))

    if (candidates.length === 0) return null

    candidates.sort((a, b) => {
      const s = score(a) - score(b)
      if (s !== 0) return s
      return new Date(b.scraped_at) - new Date(a.scraped_at)
    })
    return candidates[0]
  }

  // Pick best from each source
  const selected = []
  const seenIds = new Set()
  for (const sourceId of SOURCE_ORDER) {
    const best = bestFromSource(sourceId)
    if (best && !seenIds.has(best.id)) {
      selected.push(best)
      seenIds.add(best.id)
    }
  }

  // Fallback if any source had no eligible article
  if (selected.length < count) {
    const remaining = articles
      .filter((a) => a.image_url)
      .filter((a) => a.bcs_relevance !== "skip")
      .filter((a) => !HIDDEN_CATEGORIES.includes(a.category))
      .filter((a) => !seenIds.has(a.id))

    remaining.sort((a, b) => {
      const s = score(a) - score(b)
      if (s !== 0) return s
      return new Date(b.scraped_at) - new Date(a.scraped_at)
    })

    for (const a of remaining) {
      selected.push(a)
      seenIds.add(a.id)
      if (selected.length >= count) break
    }
  }

  return selected
}

/**
 * Sort articles purely by scraped_at DESC (newest first).
 * Replaces the old round-robin which forced source order over recency.
 */
function sortNewestFirst(articles) {
  return [...articles].sort(
    (a, b) => new Date(b.scraped_at) - new Date(a.scraped_at)
  )
}


function HomePage() {
  const [language, setLanguage] = useState(null)
  const [stories, setStories] = useState([])
  const [articles, setArticles] = useState([])
  const [categoryCounts, setCategoryCounts] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      Promise.resolve([]),  // V2: re-enable after e5-large embedding swap
      listArticles({ limit: 100, language }),
      getCategoryStats(),
    ])
      .then(([storiesData, articlesData, statsData]) => {
        setStories(storiesData)
        setArticles(articlesData)
        setCategoryCounts(statsData)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [language])

  const featured = pickFeaturedArticles(
    articles.filter(a => !language || a.language === language),
    3
  )
  const featuredIds = new Set(featured.map((a) => a.id))
  const sorted = sortNewestFirst(articles)
  const restArticles = sorted.filter((a) => !featuredIds.has(a.id))

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-8 h-8 border-2 border-brand-navy-200 border-t-brand-gold-500 rounded-full animate-spin" />
        <p className="text-brand-navy-500 mt-4 text-sm">Loading today&apos;s news...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <strong>Error:</strong> {error}
      </div>
    )
  }

  return (
    <div>
      <GreetingBar />

      <div className="mb-8">
        <LanguageTabs selected={language} onChange={setLanguage} />
      </div>

      <FeaturedStories articles={featured} />

      <TodaysBCSPicks language={language} />

      {stories.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-10"
        >
          <div className="flex items-baseline gap-3 mb-4">
            <Sparkles className="w-4 h-4 text-brand-gold-500" />
            <h2 className="text-xs font-bold tracking-widest uppercase text-brand-navy-900">
              Top Stories
            </h2>
            <span className="text-xs text-brand-navy-500">
              Covered by multiple sources
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {stories.map((s, i) => (
              <StoryCard key={s.story_id} story={s} index={i} />
            ))}
          </div>
        </motion.section>
      )}

      <CategoryGrid counts={categoryCounts} />

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <div className="flex items-baseline gap-3 mb-4">
          <Newspaper className="w-4 h-4 text-brand-navy-500" />
          <h2 className="text-xs font-bold tracking-widest uppercase text-brand-navy-900">
            Latest Articles
          </h2>
          <span className="text-xs text-brand-navy-500">
            {restArticles.length} stories &middot; newest first
          </span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {restArticles.map((a, i) => (
            <ArticleCard key={a.id} article={a} index={i} />
          ))}
        </div>
      </motion.section>
    </div>
  )
}

export default HomePage
