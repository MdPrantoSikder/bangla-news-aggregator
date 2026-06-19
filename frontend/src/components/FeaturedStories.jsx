import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"
import SourceBadge from "./SourceBadge"
import { CATEGORY_LABEL } from "../utils"


function MainLead({ article }) {
  if (!article) return null
  const summary = article.summary_en
  || article.summary_bn
  || (article.body ? article.body.slice(0, 180).trim() + "..." : null)

  return (
    <Link
      to={`/article/${article.id}`}
      className="group block h-full bg-white rounded-2xl overflow-hidden border border-brand-navy-100 hover:border-brand-gold-300 shadow-sm hover:shadow-2xl transition-all duration-500"
    >
      {article.image_url && (
        <div className="relative aspect-[16/10] overflow-hidden bg-brand-navy-100">
          <motion.img
            src={article.image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            onError={(e) => { e.target.parentElement.style.display = "none" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md bg-brand-gold-500 text-brand-navy-950">
              <Sparkles className="w-3 h-3" strokeWidth={2.5} />
              Top Story
            </span>
            <SourceBadge sourceId={article.source_id} />
          </div>
        </div>
      )}

      <div className="p-6">
        {article.category && (
          <div className="text-[10px] uppercase tracking-widest font-bold text-brand-gold-600 mb-2">
            {CATEGORY_LABEL[article.category] || article.category}
          </div>
        )}
        <h2
          lang={article.language}
          className="font-display text-2xl md:text-3xl font-bold text-brand-navy-900 leading-tight mb-3 group-hover:text-brand-navy-700 transition-colors line-clamp-3"
        >
          {article.headline}
        </h2>
        {summary && (
          <p
            lang={article.language}
            className="text-sm text-brand-navy-500 leading-relaxed line-clamp-3 mb-4"
          >
            {summary}
          </p>
        )}
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-gold-600 group-hover:text-brand-gold-700">
          Read full story
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  )
}


function SecondaryLead({ article }) {
  if (!article) return null

  return (
    <Link
      to={`/article/${article.id}`}
      className="group flex gap-3 bg-white rounded-xl overflow-hidden border border-brand-navy-100 hover:border-brand-gold-300 shadow-sm hover:shadow-lg transition-all duration-300 p-3 h-full"
    >
      {article.image_url && (
        <div className="relative w-28 sm:w-32 flex-shrink-0 aspect-square rounded-lg overflow-hidden bg-brand-navy-100">
          <img
            src={article.image_url}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.parentElement.style.display = "none" }}
          />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 mb-1.5">
          <SourceBadge sourceId={article.source_id} />
        </div>
        <h3
          lang={article.language}
          className="font-display text-sm md:text-base font-bold text-brand-navy-900 leading-snug group-hover:text-brand-navy-700 transition-colors line-clamp-3"
        >
          {article.headline}
        </h3>
        {article.category && (
          <div className="mt-auto pt-2 text-[10px] uppercase tracking-widest font-bold text-brand-gold-600">
            {CATEGORY_LABEL[article.category] || article.category}
          </div>
        )}
      </div>
    </Link>
  )
}


export default function FeaturedStories({ articles }) {
  if (!articles || articles.length === 0) return null

  const [main, second, third] = articles

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-10"
    >
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <MainLead article={main} />
        </div>

        <div className="flex flex-col gap-4">
          {second && <SecondaryLead article={second} />}
          {third && <SecondaryLead article={third} />}
        </div>
      </div>
    </motion.section>
  )
}
