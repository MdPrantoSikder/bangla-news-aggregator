import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"
import SourceBadge from "./SourceBadge"
import { timeAgo } from "../utils"


export default function StoryCard({ story, index = 0 }) {
  // Pick ONE lead article: prefer one with a summary, fall back to the first.
  // Headline AND summary MUST come from the same article — never mix.
  const leadArticle =
    story.articles.find((a) => a.summary_en || a.summary_bn) || story.articles[0]
  const summary = leadArticle.summary_en || leadArticle.summary_bn

  // Get unique source IDs from articles (for badges row)
  const uniqueSources = [...new Set(story.articles.map((a) => a.source_id))]

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link
        to={`/story/${story.story_id}`}
        className="group relative block h-full bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-brand-navy-900 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-brand-navy-800"
      >
        {/* Gold corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-gold-500/20 via-brand-gold-500/5 to-transparent pointer-events-none" />

        {/* Top-left gold tag */}
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md bg-brand-gold-500 text-brand-navy-950">
            <Sparkles className="w-3 h-3" strokeWidth={2.5} />
            Featured Story
          </span>
        </div>

        <div className="relative p-6 pt-14 flex flex-col h-full">
          {/* Source count */}
          <div className="text-xs text-brand-gold-300 font-semibold uppercase tracking-wider mb-3">
            Covered by {uniqueSources.length} {uniqueSources.length === 1 ? "source" : "sources"}
          </div>

          <h3
            lang={leadArticle.language}
            className="font-display text-2xl font-bold text-white leading-snug mb-3 group-hover:text-brand-gold-100 transition-colors line-clamp-3"
          >
            {leadArticle.headline}
          </h3>

          {summary && (
            <p
              lang={leadArticle.language}
              className="text-sm text-brand-navy-100/80 leading-relaxed line-clamp-3 mb-5"
            >
              {summary}
            </p>
          )}

          {/* Source badges row */}
          <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
            {uniqueSources.slice(0, 4).map((sid) => (
              <SourceBadge key={sid} sourceId={sid} />
            ))}
          </div>

          {/* Bottom row: time + CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-xs text-brand-navy-200">
              {timeAgo(leadArticle.scraped_at || leadArticle.published_at || story.created_at)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold-300 group-hover:text-brand-gold-500 transition-colors">
              View all versions
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

