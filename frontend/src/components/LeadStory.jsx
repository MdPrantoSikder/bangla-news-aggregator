import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"
import SourceBadge from "./SourceBadge"
import { CATEGORY_LABEL } from "../utils"


export default function LeadStory({ article }) {
  if (!article) return null

  const summary = article.summary_en || article.summary_bn

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-10"
    >
      <Link
        to={`/article/${article.id}`}
        className="group block bg-white rounded-2xl overflow-hidden border border-brand-navy-100 hover:border-brand-gold-300 shadow-sm hover:shadow-2xl transition-all duration-500"
      >
        <div className="grid md:grid-cols-2 gap-0">

          {/* Image */}
          {article.image_url ? (
            <div className="relative aspect-[4/3] md:aspect-auto overflow-hidden bg-brand-navy-100">
              <motion.img
                src={article.image_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                onError={(e) => { e.target.parentElement.style.display = "none" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="aspect-[4/3] md:aspect-auto bg-gradient-to-br from-brand-navy-800 to-brand-navy-900" />
          )}

          {/* Content */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md bg-brand-gold-500 text-brand-navy-950">
                <Sparkles className="w-3 h-3" strokeWidth={2.5} />
                Today's Lead
              </span>
              <SourceBadge sourceId={article.source_id} />
              {article.category && (
                <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md bg-brand-navy-50 text-brand-navy-700">
                  {CATEGORY_LABEL[article.category] || article.category}
                </span>
              )}
            </div>

            <h2
              lang={article.language}
              className="font-display text-2xl md:text-3xl font-bold text-brand-navy-900 leading-tight mb-4 group-hover:text-brand-navy-700 transition-colors"
            >
              {article.headline}
            </h2>

            {summary && (
              <p
                lang={article.language}
                className="text-base text-brand-navy-500 leading-relaxed mb-5 line-clamp-3"
              >
                {summary}
              </p>
            )}

            <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-gold-600 group-hover:text-brand-gold-700">
              Read full story
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </Link>
    </motion.section>
  )
}
