/**
 * Format an ISO timestamp as a human-friendly relative time.
 */
export function timeAgo(isoString) {
  if (!isoString) return ""
  const date = new Date(isoString)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/**
 * Source ID -> display info. Update if you scrape new sources.
 * Each source gets its own brand color for instant visual recognition.
 */
const SOURCE_INFO = {
  1: {
    name: "The Daily Star",
    short: "DS",
    bg: "bg-[#0F2C4F]",
    text: "text-white",
    accent: "bg-[#0F2C4F]",
  },
  2: {
    name: "Prothom Alo",
    short: "PA",
    bg: "bg-[#C8102E]",
    text: "text-white",
    accent: "bg-[#C8102E]",
  },
  6: {
    name: "Business Standard",
    short: "TBS",
    bg: "bg-[#1B5E20]",
    text: "text-white",
    accent: "bg-[#1B5E20]",
  },
  10: {
    name: "Prothom Alo EN",
    short: "PA-EN",
    bg: "bg-[#8B1A1A]",
    text: "text-white",
    accent: "bg-[#8B1A1A]",
  },
}

export function getSourceInfo(sourceId) {
  return (
    SOURCE_INFO[sourceId] || {
      name: `Source ${sourceId}`,
      short: `S${sourceId}`,
      bg: "bg-brand-navy-500",
      text: "text-white",
      accent: "bg-brand-navy-500",
    }
  )
}

export const LANG_LABEL = {
  en: "EN",
  bn: "বাং",
}

/**
 * Category slug -> display label.
 */
export const CATEGORY_LABEL = {
  bangladesh: "Bangladesh",
  world: "World",
  economy: "Economy",
  sports: "Sports",
  science_tech: "Sci/Tech",
  education: "Education",
  opinion: "Opinion",
  lifestyle: "Lifestyle",
  other: "Other",
}

