import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { LogIn, Mail, Lock, AlertCircle, BookOpen, Loader2 } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"


export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  // After login, redirect back to wherever the user came from (default: /study-space).
  const redirectTo = location.state?.from || "/study-space"

  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setSubmitting(true)
    setFormError(null)
    try {
      await login({ email: email.trim(), password })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setFormError(err.message || "Login failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-brand-navy-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-brand-navy-900 to-brand-navy-800 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-gold-500/25 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-gold-500 items-center justify-center mb-3">
              <BookOpen className="w-7 h-7 text-brand-navy-950" strokeWidth={2.5} />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-sm text-brand-navy-200 mt-1">
              Log in to continue your BCS preparation
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {formError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </motion.div>
          )}

          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-brand-navy-700 mb-1.5 block">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy-300" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-navy-200 focus:outline-none focus:border-brand-gold-400 focus:ring-2 focus:ring-brand-gold-300/40 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-brand-navy-700 mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy-300" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-navy-200 focus:outline-none focus:border-brand-gold-400 focus:ring-2 focus:ring-brand-gold-300/40 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !email.trim() || !password}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-brand-gold-500 text-brand-navy-950 font-bold hover:bg-brand-gold-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Log In
              </>
            )}
          </button>

          <p className="text-center text-sm text-brand-navy-500">
            Don&apos;t have an account?{" "}
            <Link to="/signup" state={{ from: redirectTo }} className="text-brand-gold-600 font-semibold hover:underline">
              Sign up free
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}
