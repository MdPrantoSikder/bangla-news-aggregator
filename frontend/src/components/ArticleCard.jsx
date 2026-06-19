import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Clock, Target } from "lucide-react"
import SourceBadge from "./SourceBadge"
import LangBadge from "./LangBadge"
import { timeAgo, CATEGORY_LABEL } from "../utils"


export default function ArticleCard({ article, index = 0 }) {
  const summary = article.summary_en || article.summary_bn

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link
        to={`/article/${article.id}`}
        className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-brand-navy-100 hover:border-brand-gold-300 shadow-sm hover:shadow-xl transition-all duration-300"
      >
        {article.image_url && (
          <div className="relative w-full aspect-[16/9] overflow-hidden bg-brand-navy-50 shrink-0">
            <motion.img
              src={article.image_url}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              onError={(e) => { e.target.parentElement.style.display = "none" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />

            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
              <SourceBadge sourceId={article.source_id} />
              {article.bcs_relevance === "high" && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md bg-brand-gold-500 text-brand-navy-950 shadow-sm">
                  <Target className="w-3 h-3" strokeWidth={2.5} />
                  BCS
                </span>
              )}
            </div>

            {article.category && (
              <div className="absolute top-3 right-3 z-10">
                <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md bg-white/95 text-brand-navy-900 backdrop-blur-sm shadow-sm">
                  {CATEGORY_LABEL[article.category] || article.category}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="p-5 flex flex-col flex-1">
          {!article.image_url && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <SourceBadge sourceId={article.source_id} />
              {article.bcs_relevance === "high" && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md bg-brand-gold-500 text-brand-navy-950">
                  <Target className="w-3 h-3" strokeWidth={2.5} />
                  BCS Important
                </span>
              )}
              {article.category && (
                <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md bg-brand-navy-50 text-brand-navy-700">
                  {CATEGORY_LABEL[article.category] || article.category}
                </span>
              )}
            </div>
          )}

          <h3
            lang={article.language}
            className="font-display text-lg font-bold text-brand-navy-900 leading-snug mb-3 group-hover:text-brand-navy-700 transition-colors line-clamp-3 min-h-[4.5rem]"
          >
            {article.headline}
          </h3>

          {summary ? (
            <p
              lang={article.language}
              className="text-sm text-brand-navy-500 leading-relaxed line-clamp-3 mb-4 flex-1"
            >
              {summary}
            </p>
          ) : article.body ? (
            <p className="text-sm text-brand-navy-400 leading-relaxed line-clamp-3 mb-4 flex-1">
              {article.body.slice(0, 180).trim()}...
            </p>
          ) : null}

          <div className="flex items-center justify-between pt-3 border-t border-brand-navy-100 mt-auto">
            <div className="flex items-center gap-2 text-xs text-brand-navy-500">
              <Clock className="w-3 h-3" />
              <span>{timeAgo(article.scraped_at)}</span>
            </div>
            <LangBadge language={article.language} />
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
