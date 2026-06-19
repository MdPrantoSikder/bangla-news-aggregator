import { Link } from "react-router-dom"
import { motion } from "framer-motion"


// Each category gets a brand-color accent on its left border.
const CATEGORIES = [
  { slug: "bangladesh",   label: "Bangladesh",  color: "border-l-[#0F2C4F]" },
  { slug: "world",        label: "World",       color: "border-l-[#C8102E]" },
  { slug: "economy",      label: "Economy",     color: "border-l-[#D4A537]" },
  { slug: "sports",       label: "Sports",      color: "border-l-[#1B5E20]" },
  { slug: "science_tech", label: "Sci/Tech",    color: "border-l-[#7C3AED]" },
  { slug: "education",    label: "Education",   color: "border-l-[#0891B2]" },
  { slug: "opinion",      label: "Opinion",     color: "border-l-[#B91C1C]" },
  { slug: "lifestyle",    label: "Lifestyle",   color: "border-l-[#EC4899]" },
]


export default function CategoryGrid({ counts = {} }) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-10"
    >
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xs font-bold tracking-widest uppercase text-brand-navy-900">
          Browse by Category
        </h2>
        <span className="text-xs text-brand-navy-500">Explore all topics</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.slug}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            whileHover={{ y: -2 }}
          >
            <Link
              to={`/category/${cat.slug}`}
              className={`block bg-white border border-brand-navy-100 border-l-4 ${cat.color} rounded-lg px-4 py-3 hover:border-brand-gold-300 hover:shadow-md transition-all duration-200`}
            >
              <div className="font-semibold text-sm text-brand-navy-900">
                {cat.label}
              </div>
              <div className="text-xs text-brand-navy-500 mt-0.5">
                {counts[cat.slug] !== undefined ? `${counts[cat.slug]} articles` : "Browse"}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
