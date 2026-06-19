/**
 * BCS exam subjects with display labels (English + Bangla) and colors.
 * Keys match what the Groq prompt emits.
 */
export const BCS_SUBJECTS = {
  bangladesh_affairs: {
    label: "Bangladesh Affairs",
    label_bn: "বাংলাদেশ বিষয়াবলী",
    color: "bg-[#0F2C4F]",
    text: "text-white",
    accent: "border-[#0F2C4F]",
    light: "bg-[#0F2C4F]/10 text-[#0F2C4F]",
  },
  international: {
    label: "International Affairs",
    label_bn: "আন্তর্জাতিক বিষয়াবলী",
    color: "bg-[#C8102E]",
    text: "text-white",
    accent: "border-[#C8102E]",
    light: "bg-[#C8102E]/10 text-[#C8102E]",
  },
  economy: {
    label: "Economy & Finance",
    label_bn: "অর্থনীতি ও অর্থ",
    color: "bg-[#D4A537]",
    text: "text-brand-navy-950",
    accent: "border-[#D4A537]",
    light: "bg-[#D4A537]/15 text-[#8F6A18]",
  },
  science_tech: {
    label: "Science & Technology",
    label_bn: "বিজ্ঞান ও প্রযুক্তি",
    color: "bg-[#7C3AED]",
    text: "text-white",
    accent: "border-[#7C3AED]",
    light: "bg-[#7C3AED]/10 text-[#7C3AED]",
  },
  geography: {
    label: "Geography & Environment",
    label_bn: "ভূগোল ও পরিবেশ",
    color: "bg-[#0891B2]",
    text: "text-white",
    accent: "border-[#0891B2]",
    light: "bg-[#0891B2]/10 text-[#0891B2]",
  },
  history_culture: {
    label: "History & Culture",
    label_bn: "ইতিহাস ও সংস্কৃতি",
    color: "bg-[#92400E]",
    text: "text-white",
    accent: "border-[#92400E]",
    light: "bg-[#92400E]/10 text-[#92400E]",
  },
  current_affairs: {
    label: "Current Affairs",
    label_bn: "চলমান বিষয়াবলী",
    color: "bg-[#1B5E20]",
    text: "text-white",
    accent: "border-[#1B5E20]",
    light: "bg-[#1B5E20]/10 text-[#1B5E20]",
  },
  not_relevant: {
    label: "Not Relevant",
    label_bn: "প্রাসঙ্গিক নয়",
    color: "bg-brand-navy-300",
    text: "text-brand-navy-700",
    accent: "border-brand-navy-300",
    light: "bg-brand-navy-100 text-brand-navy-500",
  },
}


/**
 * BCS relevance levels with colors.
 */
export const BCS_RELEVANCE = {
  high: {
    label: "BCS Important",
    label_bn: "BCS গুরুত্বপূর্ণ",
    color: "bg-brand-gold-500",
    text: "text-brand-navy-950",
    icon: "🎯",
  },
  medium: {
    label: "Worth Reading",
    label_bn: "পড়ার মতো",
    color: "bg-brand-navy-700",
    text: "text-white",
    icon: "📖",
  },
  low: {
    label: "Background",
    label_bn: "পটভূমি",
    color: "bg-brand-navy-100",
    text: "text-brand-navy-600",
    icon: "•",
  },
  skip: {
    label: "Skip for BCS",
    label_bn: "BCS এর জন্য বাদ",
    color: "bg-transparent",
    text: "text-brand-navy-300",
    icon: "—",
  },
}


export function getBCSSubject(slug) {
  return BCS_SUBJECTS[slug] || BCS_SUBJECTS.not_relevant
}


export function getBCSRelevance(level) {
  return BCS_RELEVANCE[level] || BCS_RELEVANCE.low
}
