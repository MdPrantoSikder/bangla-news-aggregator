import { Link, NavLink, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import {
  Search, BookOpen, GraduationCap, Target,
  User as UserIcon, LogOut, ChevronDown, LogIn, UserPlus, Shield
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"


const CATEGORIES = [
  { slug: "bangladesh", label: "Bangladesh" },
  { slug: "world", label: "World" },
  { slug: "economy", label: "Economy" },
  { slug: "sports", label: "Sports" },
  { slug: "science_tech", label: "Sci/Tech" },
  { slug: "education", label: "Education" },
  { slug: "opinion", label: "Opinion" },
  { slug: "lifestyle", label: "Lifestyle" },
]


function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="w-10 h-10 rounded-lg bg-brand-navy-900 flex items-center justify-center shadow-sm group-hover:bg-brand-navy-800 transition-colors">
        <BookOpen className="w-5 h-5 text-brand-gold-500" strokeWidth={2.5} />
      </div>
      <div className="leading-tight">
        <div className="font-display text-lg font-bold text-brand-navy-900 tracking-tight">
          BanglaBrief
        </div>
        <div className="text-[10px] uppercase tracking-widest text-brand-navy-500 font-semibold">
          AI News for BCS Aspirants
        </div>
      </div>
    </Link>
  )
}


function getInitials(user) {
  if (user.full_name) {
    return user.full_name.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase()
  }
  return user.email[0].toUpperCase()
}


function ProfileMenu() {
  const { user, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const handleLogout = () => {
    logout()
    setOpen(false)
    navigate("/")
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-brand-navy-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-brand-gold-500 text-brand-navy-950 font-bold text-sm flex items-center justify-center flex-shrink-0">
          {getInitials(user)}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-brand-navy-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-64 bg-white border border-brand-navy-100 rounded-xl shadow-xl overflow-hidden"
          >
            {/* User info header */}
            <div className="px-4 py-3 bg-brand-navy-50 border-b border-brand-navy-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-gold-500 text-brand-navy-950 font-bold text-base flex items-center justify-center flex-shrink-0">
                  {getInitials(user)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-brand-navy-900 truncate">
                    {user.full_name || user.email.split("@")[0]}
                  </div>
                  <div className="text-xs text-brand-navy-500 truncate">{user.email}</div>
                </div>
              </div>
              {isAdmin && (
                <div className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-brand-gold-500 text-brand-navy-950">
                  <Shield className="w-2.5 h-2.5" /> Admin
                </div>
              )}
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                to="/study-space"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-navy-700 hover:bg-brand-navy-50 transition-colors"
              >
                <GraduationCap className="w-4 h-4 text-brand-navy-400" />
                Study Space
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-navy-700 hover:bg-brand-navy-50 transition-colors"
                >
                  <Shield className="w-4 h-4 text-brand-navy-400" />
                  Admin Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-brand-navy-100"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


function AuthButtons() {
  return (
   <Link
      to="/login"
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-navy-900 text-white text-sm font-semibold hover:bg-brand-navy-700 transition-colors flex-shrink-0"
    >
      <LogIn className="w-4 h-4 text-brand-gold-400" />
      <span className="hidden sm:inline">Sign In</span>
    </Link>
  )
}


export default function Header() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const { isLoggedIn } = useAuth()

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-white border-b border-brand-navy-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95"
    >
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-3">
        <Logo />

        <form onSubmit={handleSearch} className="hidden lg:flex relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy-300" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles, topics, people..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-brand-navy-50 text-sm text-brand-ink placeholder:text-brand-navy-300 border border-transparent focus:outline-none focus:bg-white focus:border-brand-navy-200 focus:ring-2 focus:ring-brand-gold-300/40 transition-all"
          />
        </form>

        <Link
          to="/bcs-feed"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-gold-500 text-brand-navy-950 text-sm font-bold hover:bg-brand-gold-600 transition-colors flex-shrink-0"
        >
          <Target className="w-4 h-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">BCS Feed</span>
        </Link>

        
          <Link
            to="/study-space"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-navy-900 text-white text-sm font-semibold hover:bg-brand-navy-700 transition-colors flex-shrink-0"
          >
            <GraduationCap className="w-4 h-4 text-brand-gold-400" />
            <span className="hidden sm:inline">Study Space</span>
          </Link>
        

        {isLoggedIn ? <ProfileMenu /> : <AuthButtons />}
      </div>

      <nav className="max-w-6xl mx-auto px-6 pb-1 flex gap-0.5 overflow-x-auto scrollbar-hide">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive ? "text-brand-navy-900" : "text-brand-navy-500 hover:text-brand-navy-900"
            }`
          }
        >
          {({ isActive }) => (
            <>
              Home
              {isActive && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-gold-500 rounded-full"
                />
              )}
            </>
          )}
        </NavLink>

        {CATEGORIES.map((c) => (
          <NavLink
            key={c.slug}
            to={`/category/${c.slug}`}
            className={({ isActive }) =>
              `relative px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive ? "text-brand-navy-900" : "text-brand-navy-500 hover:text-brand-navy-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {c.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-gold-500 rounded-full"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </motion.header>
  )
}

