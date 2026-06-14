import { useState, useEffect, useCallback } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Shield, Users, Newspaper, Target,
  Play, RefreshCw, AlertCircle, CheckCircle2, ArrowLeft,
  Database, TrendingUp, FileText, Loader2, Zap
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"


const API = "http://localhost:8000"


function StatCard({ icon: Icon, label, value, accent = "gold" }) {
  const accents = {
    gold: "bg-brand-gold-100 text-brand-gold-700",
    navy: "bg-brand-navy-100 text-brand-navy-700",
  }
  return (
    <motion.div whileHover={{ y: -2 }}
      className="bg-white rounded-xl border border-brand-navy-100 p-5 h-full">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accents[accent]}`}>
          <Icon className="w-5 h-5" strokeWidth={2.5} />
        </div>
      </div>
      <div className="text-3xl font-bold text-brand-navy-900 leading-none">{value}</div>
      <div className="text-xs uppercase tracking-widest font-bold text-brand-navy-500 mt-2">{label}</div>
    </motion.div>
  )
}


function DistributionBar({ data, totalLabel = "" }) {
  const total = Object.values(data || {}).reduce((a, b) => a + b, 0)
  if (!total) return <p className="text-sm text-brand-navy-400 italic">No data yet</p>
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([key, value]) => {
        const pct = ((value / total) * 100).toFixed(1)
        return (
          <div key={key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-brand-navy-700 capitalize">{key}</span>
              <span className="text-brand-navy-500">{value} ({pct}%)</span>
            </div>
            <div className="h-2 bg-brand-navy-50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6 }}
                className="h-full bg-gradient-to-r from-brand-gold-400 to-brand-gold-600"
              />
            </div>
          </div>
        )
      })}
      {totalLabel && (
        <div className="text-xs text-brand-navy-400 pt-2 border-t border-brand-navy-100">
          {totalLabel}: <span className="font-semibold text-brand-navy-700">{total}</span>
        </div>
      )}
    </div>
  )
}


export default function AdminPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState(null)
  const [logLines, setLogLines] = useState([])
  const [logLoading, setLogLoading] = useState(false)
  const [groqUsage, setGroqUsage] = useState(null)
  const [triggering, setTriggering] = useState(false)
  const [triggerMsg, setTriggerMsg] = useState(null)

  const getHeaders = () => {
    const stored = JSON.parse(localStorage.getItem("banglabrief_auth") || "{}")
    const token = auth.token || stored.token
    return { "Authorization": `Bearer ${token}` }
  }

  const fetchStats = useCallback(async () => {
    setStatsLoading(true); setStatsError(null)
    try {
      const res = await fetch(`${API}/admin/stats`, { headers: getHeaders() })
      if (!res.ok) throw new Error(`Stats failed (${res.status})`)
      setStats(await res.json())
    } catch (e) { setStatsError(e.message) }
    finally { setStatsLoading(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchLog = useCallback(async () => {
    setLogLoading(true)
    try {
      const res = await fetch(`${API}/admin/daily-brief-log?lines=50`, { headers: getHeaders() })
      if (!res.ok) throw new Error(`Log fetch failed (${res.status})`)
      const data = await res.json()
      setLogLines(data.lines || [])
    } catch (e) { setLogLines([`Error: ${e.message}`]) }
    finally { setLogLoading(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchGroqUsage = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/groq-usage`, { headers: getHeaders() })
      if (res.ok) setGroqUsage(await res.json())
    } catch (e) { console.error("Groq usage fetch failed:", e) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const triggerDailyBrief = async () => {
    if (triggering) return
    setTriggering(true)
    setTriggerMsg({ type: "info", text: "Starting daily brief..." })
    try {
      const res = await fetch(`${API}/admin/run-daily-brief`, {
        method: "POST",
        headers: getHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `Trigger failed (${res.status})`)
      setTriggerMsg({ type: "success", text: data.message || "Daily brief job started in background" })
      setTimeout(() => fetchLog(), 3000)
      setTimeout(() => { fetchStats(); fetchGroqUsage() }, 30000)
    } catch (e) {
      setTriggerMsg({ type: "error", text: e.message })
    } finally {
      setTriggering(false)
    }
  }

  useEffect(() => {
    fetchStats(); fetchLog(); fetchGroqUsage()
  }, [fetchStats, fetchLog, fetchGroqUsage])

  const SOURCE_NAMES = { 1: "Daily Star", 2: "Prothom Alo", 6: "The Business Standard", 10: "Prothom Alo English" }
  const sourceBreakdown = stats?.by_source
    ? Object.fromEntries(
        Object.entries(stats.by_source).map(([id, count]) => [SOURCE_NAMES[id] || `Source ${id}`, count])
      )
    : {}

  return (
    <div className="max-w-5xl mx-auto">
      <button type="button" onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-navy-500 hover:text-brand-gold-600 mb-4 cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-brand-navy-900 to-brand-navy-800 rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-brand-gold-500/25 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-gold-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-brand-navy-950" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-brand-gold-300">Administrator</div>
              <h1 className="font-display text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-brand-navy-200 mt-0.5">Site stats and manual controls</p>
            </div>
          </div>
          <button type="button" onClick={() => { fetchStats(); fetchLog(); fetchGroqUsage() }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </motion.div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          [1,2,3,4].map(i => <div key={i} className="bg-brand-navy-50 rounded-xl h-28 animate-pulse" />)
        ) : statsError ? (
          <div className="col-span-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 inline mr-2" /> {statsError}
          </div>
        ) : (
          <>
            <Link to="/" className="block"><StatCard icon={Newspaper} label="Total Articles" value={stats.total_articles} accent="gold" /></Link>
            <Link to="/admin/users" className="block"><StatCard icon={Users} label="Total Users" value={stats.total_users} accent="navy" /></Link>
            <Link to="/bcs-feed" className="block"><StatCard icon={Target} label="BCS Classified" value={stats.bcs_classified} accent="gold" /></Link>
            <div><StatCard icon={Database} label="Sources" value={Object.keys(stats.by_source || {}).length} accent="navy" /></div>
          </>
        )}
      </div>

      {/* Groq token usage card */}
      {groqUsage?.today && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-brand-navy-100 p-6 mb-8">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-brand-gold-500" strokeWidth={2.5} />
                <h3 className="font-bold text-sm text-brand-navy-900 uppercase tracking-widest">Groq Token Usage</h3>
              </div>
              <p className="text-xs text-brand-navy-500">
                Today {groqUsage.today.date} &middot; resets at 00:00 UTC (6 AM Dhaka)
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-brand-navy-900">
                {groqUsage.today.used.toLocaleString()}
              </div>
              <div className="text-xs text-brand-navy-500">
                of {groqUsage.today.limit.toLocaleString()} tokens
              </div>
            </div>
          </div>

          <div className="h-3 bg-brand-navy-50 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(groqUsage.today.pct_used, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${
                groqUsage.today.pct_used >= 90
                  ? "bg-red-500"
                  : groqUsage.today.pct_used >= 70
                  ? "bg-brand-gold-500"
                  : "bg-green-500"
              }`}
            />
          </div>

          <div className="flex justify-between text-xs text-brand-navy-500">
            <span>{groqUsage.today.pct_used}% used</span>
            <span>{groqUsage.today.remaining.toLocaleString()} tokens remaining</span>
          </div>
        </motion.div>
      )}

      {/* Trigger card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-brand-gold-500 to-brand-gold-600 rounded-2xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest font-bold text-brand-navy-950/70 mb-1">
                Manual Trigger
              </div>
              <h3 className="font-display text-xl font-bold text-brand-navy-950">Run Daily Brief Now</h3>
              <p className="text-sm text-brand-navy-950/80 mt-1">
                Scrapes all sources, computes embeddings, runs BCS analysis. Takes 3-10 minutes.
              </p>
            </div>
            <button type="button" onClick={triggerDailyBrief} disabled={triggering}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-navy-900 text-white font-bold hover:bg-brand-navy-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg cursor-pointer flex-shrink-0">
              {triggering ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Running...</>
              ) : (
                <><Play className="w-4 h-4 text-brand-gold-400" /> Run Now</>
              )}
            </button>
          </div>

          {triggerMsg && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
                triggerMsg.type === "success"
                  ? "bg-brand-navy-950 text-brand-gold-300"
                  : triggerMsg.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-brand-navy-900/20 text-brand-navy-950"
              }`}>
              {triggerMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
               : triggerMsg.type === "error" ? <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
               : <Loader2 className="w-4 h-4 flex-shrink-0 mt-0.5 animate-spin" />}
              <span>{triggerMsg.text}</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Distribution cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-brand-navy-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-brand-gold-500" />
            <h3 className="font-bold text-sm text-brand-navy-900 uppercase tracking-widest">By Source</h3>
          </div>
          {statsLoading ? <div className="h-32 bg-brand-navy-50 rounded animate-pulse" /> : <DistributionBar data={sourceBreakdown} totalLabel="Total articles" />}
        </div>

        <div className="bg-white rounded-xl border border-brand-navy-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-brand-gold-500" />
            <h3 className="font-bold text-sm text-brand-navy-900 uppercase tracking-widest">BCS Relevance</h3>
          </div>
          {statsLoading ? <div className="h-32 bg-brand-navy-50 rounded animate-pulse" /> : <DistributionBar data={stats?.by_relevance || {}} totalLabel="Total classified" />}
        </div>
      </div>

      {/* Log viewer */}
      <div className="bg-white rounded-xl border border-brand-navy-100 overflow-hidden mb-8">
        <div className="flex items-center justify-between px-5 py-3 border-b border-brand-navy-100 bg-brand-navy-50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-gold-500" />
            <h3 className="font-bold text-sm text-brand-navy-900 uppercase tracking-widest">Daily Brief Log</h3>
            <span className="text-xs text-brand-navy-400">last 50 lines</span>
          </div>
          <button type="button" onClick={fetchLog}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-navy-500 hover:text-brand-gold-600 cursor-pointer">
            <RefreshCw className={`w-3 h-3 ${logLoading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        <pre className="bg-brand-navy-950 text-brand-gold-300 text-[11px] leading-relaxed p-4 overflow-x-auto max-h-96 overflow-y-auto font-mono">
          {logLines.length === 0
            ? <span className="text-brand-navy-400">No log entries yet. Trigger the daily brief to see output.</span>
            : logLines.join("\n")}
        </pre>
      </div>

      <div className="mt-10 text-center text-xs text-brand-navy-400 pb-6">
        Admin Dashboard &middot; BanglaBrief
      </div>
    </div>
  )
}
