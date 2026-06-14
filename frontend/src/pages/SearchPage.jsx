import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Clock, Target } from "lucide-react"
import { searchArticles } from "../api"
import SourceBadge from "../components/SourceBadge"
import LangBadge from "../components/LangBadge"
import SaveButton from "../components/SaveButton"
import { timeAgo, CATEGORY_LABEL } from "../utils"


function SearchResultCard({ article, index }) {
  const summary = article.summary_en || article.summary_bn

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <Link
        to={`/article/${article.id}`}
        className="group flex gap-4 bg-white rounded-xl border border-brand-navy-100 hover:border-brand-gold-300 p-4 hover:shadow-lg transition-all duration-300"
      >
        {article.image_url && (
          <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-brand-navy-50">
            <img
              src={article.image_url}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.target.parentElement.style.display = "none" }}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <SourceBadge sourceId={article.source_id} />
            {article.category && (
              <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-brand-navy-50 text-brand-navy-700">
                {CATEGORY_LABEL[article.category] || article.category}
              </span>
            )}
            {article.bcs_relevance === "high" && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-brand-gold-500 text-brand-navy-950">
                <Target className="w-3 h-3" />
                BCS
              </span>
            )}
            <LangBadge language={article.language} />
          </div>

          <h3
            lang={article.language}
            className="font-display font-bold text-brand-navy-900 leading-snug mb-1 group-hover:text-brand-navy-700 transition-colors line-clamp-2"
          >
            {article.headline}
          </h3>

          {summary && (
            <p
              lang={article.language}
              className="text-xs text-brand-navy-500 leading-relaxed line-clamp-2 mb-2"
            >
              {summary}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-brand-navy-400">
              <Clock className="w-3 h-3" />
              {timeAgo(article.scraped_at)}
            </div>
            <div onClick={(e) => e.preventDefault()}>
              <SaveButton article={article} size="sm" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}


export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get("q") || ""
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)
  const [inputValue, setInputValue] = useState(query)
  const [searchType, setSearchType] = useState("hybrid")

  useEffect(() => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setSearched(true)
    searchArticles(query, searchType, 30)
      .then((data) => { setResults(data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [query, searchType])

  const handleSubmit = (e) => {
    e.preventDefault()
    const q = inputValue.trim()
    if (q) setSearchParams({ q })
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display text-3xl font-bold text-brand-navy-900 mb-6">
          Search Articles
        </h1>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-navy-300" />
            <input
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search by topic, person, event..."
              autoFocus
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-brand-navy-200 text-brand-ink placeholder:text-brand-navy-300 focus:outline-none focus:border-brand-gold-400 focus:ring-2 focus:ring-brand-gold-300/40 transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-brand-navy-900 text-white text-sm font-bold hover:bg-brand-navy-700 transition-colors flex-shrink-0"
          >
            Search
          </button>
        </form>

        {/* Search type toggle */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-brand-navy-400 font-medium">Mode:</span>
          {["hybrid", "keyword", "semantic"].map((type) => (
            <button
              key={type}
              onClick={() => setSearchType(type)}
              className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
                searchType === type
                  ? "bg-brand-navy-900 text-brand-gold-400"
                  : "bg-brand-navy-50 text-brand-navy-500 hover:bg-brand-navy-100"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
          <span className="text-xs text-brand-navy-300 ml-1">
            {searchType === "hybrid" && "Best results (recommended)"}
            {searchType === "keyword" && "Exact word match"}
            {searchType === "semantic" && "Meaning-based match"}
          </span>
        </div>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-brand-navy-200 border-t-brand-gold-500 rounded-full animate-spin" />
          <p className="text-brand-navy-500 mt-4 text-sm">Searching...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {!loading && !error && searched && (
        <>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-sm font-semibold text-brand-navy-700">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </span>
            {query && (
              <span className="text-sm text-brand-navy-400">
                for &ldquo;{query}&rdquo;
              </span>
            )}
          </div>

          <AnimatePresence>
            {results.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 bg-brand-navy-50 rounded-2xl"
              >
                <Search className="w-10 h-10 text-brand-navy-300 mx-auto mb-3" />
                <p className="font-semibold text-brand-navy-600">No results found</p>
                <p className="text-sm text-brand-navy-400 mt-1">
                  Try different keywords or switch to Semantic mode
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {results.map((article, i) => (
                  <SearchResultCard key={article.id} article={article} index={i} />
                ))}
              </div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Initial state */}
      {!searched && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 text-brand-navy-400"
        >
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Type a query above to search across all articles</p>
        </motion.div>
      )}
    </div>
  )
}
