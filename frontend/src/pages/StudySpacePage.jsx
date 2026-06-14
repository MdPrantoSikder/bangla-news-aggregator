import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  BookOpen, Bookmark, Highlighter, BookMarked, Folder,
  Target, Newspaper, Sparkles, ArrowRight, TrendingUp,
  Languages, Trophy, Flame, Clock, ChevronRight, Lock
} from "lucide-react"
import { useStudySpace } from "../hooks/useStudySpace"
import { useTimeSpent } from "../hooks/useTimeSpent"


// Section heading
function SectionHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-baseline gap-3 mb-4 mt-10">
      <Icon className="w-4 h-4 text-brand-gold-500" />
      <h2 className="text-xs font-bold tracking-widest uppercase text-brand-navy-900">{title}</h2>
      {subtitle && <span className="text-xs text-brand-navy-500">{subtitle}</span>}
    </div>
  )
}


// Library card - links to sub-page
function LibraryCard({ icon: Icon, value, label, description, href }) {
  return (
    <Link to={href} className="group">
      <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}
        className="bg-white rounded-xl border border-brand-navy-100 hover:border-brand-gold-300 hover:shadow-md p-5 transition-all h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-brand-gold-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-brand-gold-700" strokeWidth={2.5} />
          </div>
          <ChevronRight className="w-4 h-4 text-brand-navy-300 group-hover:text-brand-gold-500 group-hover:translate-x-1 transition-all" />
        </div>
        <div className="text-3xl font-bold text-brand-navy-900 leading-none mb-1">{value}</div>
        <div className="text-xs uppercase tracking-widest font-bold text-brand-navy-700 mb-2">{label}</div>
        <p className="text-xs text-brand-navy-400 leading-relaxed">{description}</p>
      </motion.div>
    </Link>
  )
}


// AI feature card - clickable, takes you to a feature
function FeatureCard({ icon: Icon, title, description, href, badge }) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Link to={href}
        className="group block bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-brand-navy-900 rounded-2xl p-6 border border-brand-navy-100 hover:border-brand-gold-300 shadow-sm hover:shadow-xl transition-all relative overflow-hidden h-full">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-gold-500/10 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-brand-gold-500 flex items-center justify-center">
              <Icon className="w-6 h-6 text-brand-navy-950" strokeWidth={2.5} />
            </div>
            {badge && (
              <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-md bg-brand-gold-500 text-brand-navy-950">
                {badge}
              </span>
            )}
          </div>
          <h3 className="font-display text-xl font-bold text-white leading-tight mb-2">{title}</h3>
          <p className="text-sm text-brand-navy-200 leading-relaxed mb-4">{description}</p>
          <div className="inline-flex items-center gap-1 text-xs font-bold text-brand-gold-300 group-hover:text-brand-gold-400">
            Open <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}


function ComingSoonCard({ icon: Icon, title, description, eta }) {
  return (
    <div className="bg-brand-navy-50 rounded-2xl p-6 border border-dashed border-brand-navy-200 relative overflow-hidden h-full">
      <div className="absolute top-3 right-3 inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-md bg-white text-brand-navy-500 border border-brand-navy-200">
        <Lock className="w-2.5 h-2.5" /> Coming Soon
      </div>
      <div className="w-12 h-12 rounded-xl bg-brand-navy-200 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-brand-navy-500" strokeWidth={2.5} />
      </div>
      <h3 className="font-display text-xl font-bold text-brand-navy-700 leading-tight mb-2">{title}</h3>
      <p className="text-sm text-brand-navy-500 leading-relaxed mb-3">{description}</p>
      {eta && (
        <div className="inline-flex items-center gap-1 text-xs font-semibold text-brand-navy-400">
          <Clock className="w-3 h-3" /> {eta}
        </div>
      )}
    </div>
  )
}


export default function StudySpacePage() {
  const { stats } = useStudySpace()
  const timeSpent = useTimeSpent()
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 5 ? "Good night"
    : hour < 12 ? "Good morning"
    : hour < 17 ? "Good afternoon"
    : hour < 21 ? "Good evening"
    : "Good night"

  return (
    <div className="max-w-5xl mx-auto">

      {/* HERO */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-brand-navy-900 rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-brand-gold-500/25 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-gold-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-brand-navy-950" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-brand-gold-300">
                Your Study Dashboard
              </div>
              <h1 className="font-display text-3xl font-bold text-white leading-tight">
                {greeting}, scholar
              </h1>
            </div>
          </div>
          <p className="text-sm text-brand-navy-200 max-w-xl mb-6">
            Your personal BCS preparation hub. Track your reading, manage saved articles,
            organize study materials, and unlock AI-powered tools.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-brand-gold-300 mb-1">
                <Clock className="w-3 h-3" /> Today
              </div>
              <div className="text-xl font-bold text-white">{timeSpent}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-brand-gold-300 mb-1">
                <Bookmark className="w-3 h-3" /> Saved
              </div>
              <div className="text-xl font-bold text-white">{stats.articles}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-brand-gold-300 mb-1">
                <Folder className="w-3 h-3" /> Folders
              </div>
              <div className="text-xl font-bold text-white">{stats.folders}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-brand-gold-300 mb-1">
                <Highlighter className="w-3 h-3" /> Highlights
              </div>
              <div className="text-xl font-bold text-white">{stats.keyPoints}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MY LIBRARY */}
      <SectionHeading icon={BookMarked} title="My Library" subtitle="Open any section to manage" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LibraryCard icon={Bookmark}    value={stats.articles}  label="Saved Articles"
          description="Bookmarks organized by date, with notes" href="/study-space/saved" />
        <LibraryCard icon={Folder}      value={stats.folders}   label="Custom Folders"
          description="Nested folders to organize your study" href="/study-space/folders" />
        <LibraryCard icon={Highlighter} value={stats.keyPoints} label="Key Points"
          description="Sentences you highlighted from articles" href="/study-space/keypoints" />
        <LibraryCard icon={BookMarked}  value={stats.glossary}  label="Glossary"
          description="Your personal BCS terms dictionary" href="/study-space/glossary" />
      </div>

      {/* AI TOOLS */}
      <SectionHeading icon={Sparkles} title="AI Tools" subtitle="Powered by Groq" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FeatureCard icon={TrendingUp} title="Topic Tracker"
          description="Track how stories evolve across days, weeks, months. See the full timeline of major events."
          href="/topics" badge="NEW" />
        <FeatureCard icon={Languages} title="Smart Vocab"
          description="AI finds hard English words. Tap any word for instant Bangla meaning + example sentence."
          href="/vocab" badge="NEW" />
      </div>

      {/* COMING SOON */}
      <SectionHeading icon={Lock} title="Coming Soon" subtitle="In development" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ComingSoonCard icon={Target}    title="AI Quiz"      description="BCS-pattern MCQs from articles with explanations and scoring." eta="Next week" />
        <ComingSoonCard icon={Newspaper} title="Daily Brief"  description="Today's news pre-digested by BCS subject in 10 minutes."      eta="Next week" />
        <ComingSoonCard icon={Trophy}    title="Mock Test"    description="Full BCS prelim simulation. 60 MCQs in 60 minutes."           eta="Coming month" />
        <ComingSoonCard icon={Flame}     title="Study Streak" description="Build a daily reading habit with streaks and stats."          eta="Coming month" />
      </div>

      <div className="mt-16 text-center text-xs text-brand-navy-400 pb-6">
        BanglaBrief Study Dashboard &middot; AI-powered BCS preparation
      </div>
    </div>
  )
}
