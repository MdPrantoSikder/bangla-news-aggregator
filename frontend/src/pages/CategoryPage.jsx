import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Newspaper } from "lucide-react"
import { listArticles } from "../api"
import ArticleCard from "../components/ArticleCard"
import LanguageTabs from "../components/LanguageTabs"
import { CATEGORY_LABEL } from "../utils"


// Hero color stripe matching the brand color used in CategoryGrid.
const CATEGORY_ACCENT = {
  bangladesh:   "from-[#0F2C4F]",
  world:        "from-[#C8102E]",
  economy:      "from-[#D4A537]",
  sports:       "from-[#1B5E20]",
  science_tech: "from-[#7C3AED]",
  education:    "from-[#0891B2]",
  opinion:      "from-[#B91C1C]",
  lifestyle:    "from-[#EC4899]",
  other:        "from-brand-navy-500",
}


function CategoryPage() {
  const { slug } = useParams()
  const [language, setLanguage] = useState(null)
  const [articles, setArticles] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const label = CATEGORY_LABEL[slug] || slug
  const accent = CATEGORY_ACCENT[slug] || "from-brand-navy-500"

  useEffect(() => {
    setLoading(true)
    setError(null)
    window.scrollTo(0, 0)
    listArticles({ limit: 50, language, category: slug })
      .then((data) => {
        setArticles(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [slug, language])

  return (
    <div>
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-navy-500 hover:text-brand-navy-900 transition-colors group mb-6"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back home
      </Link>

      {/* Category hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`relative bg-gradient-to-br ${accent} to-brand-navy-900 rounded-2xl p-8 mb-8 overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-brand-gold-500/20 via-brand-gold-500/5 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-widest font-bold text-brand-gold-300 mb-2">
            Category
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">
            {label}
          </h1>
          <p className="text-sm text-brand-navy-200 mt-3">
            {loading ? "Loading articles..." : `${articles.length} article${articles.length === 1 ? "" : "s"} in this category`}
          </p>
        </div>
      </motion.div>

      {/* Language filter */}
      <div className="mb-8">
        <LanguageTabs selected={language} onChange={setLanguage} />
      </div>

      {loading && (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-brand-navy-200 border-t-brand-gold-500 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-brand-navy-50 rounded-2xl"
        >
          <Newspaper className="w-12 h-12 text-brand-navy-300 mx-auto mb-3" />
          <p className="text-brand-navy-500 font-semibold">No articles in this category yet</p>
          <p className="text-sm text-brand-navy-300 mt-1">Check back later or browse other categories</p>
        </motion.div>
      )}

      {!loading && !error && articles.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((a, i) => (
            <ArticleCard key={a.id} article={a} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

export default CategoryPage
