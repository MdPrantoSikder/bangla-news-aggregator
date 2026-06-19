import { motion, AnimatePresence } from "framer-motion"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { useStudySpace } from "../hooks/useStudySpace"

export default function SaveButton({ article, size = "sm" }) {
  const { isArticleSaved, saveArticle, unsaveArticle } = useStudySpace()
  const saved = isArticleSaved(article.id)

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (saved) {
      unsaveArticle(article.id)
    } else {
      saveArticle(article)
    }
  }

  const sizeClasses = size === "lg"
    ? "px-4 py-2 text-sm gap-2"
    : "px-2.5 py-1.5 text-xs gap-1.5"

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.92 }}
      className={`inline-flex items-center font-semibold rounded-lg transition-all duration-200 ${sizeClasses} ${
        saved
          ? "bg-brand-gold-500 text-brand-navy-950 hover:bg-brand-gold-600"
          : "bg-brand-navy-50 text-brand-navy-700 hover:bg-brand-navy-100"
      }`}
      title={saved ? "Remove from study space" : "Save to study space"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {saved ? (
          <motion.span
            key="saved"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.15 }}
          >
            <BookmarkCheck className={size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} />
          </motion.span>
        ) : (
          <motion.span
            key="unsaved"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Bookmark className={size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} />
          </motion.span>
        )}
      </AnimatePresence>
      {saved ? "Saved" : "Save"}
    </motion.button>
  )
}
