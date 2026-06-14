import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, ArrowLeft, Shield, Mail, RefreshCw, AlertCircle,
  Calendar, UserX, UserCheck, X, Send, Trash2
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"


const API = "http://localhost:8000"


function timeAgo(iso) {
  if (!iso) return "—"
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)  return "just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30)  return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}


function DeactivateModal({ user, onClose, onConfirm }) {
  const [sendEmail, setSendEmail] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    setSubmitting(true)
    await onConfirm(sendEmail)
    setSubmitting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-brand-navy-100 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-brand-navy-900">
                Deactivate user?
              </h2>
              <p className="text-sm text-brand-navy-500 mt-0.5">
                {user.full_name || user.email}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-navy-300 hover:text-brand-navy-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-brand-navy-50 rounded-lg p-3 text-sm text-brand-navy-700">
            <strong>Soft-delete:</strong> their account will be disabled but data preserved.
            You can reactivate them later.
          </div>

          <label className="flex items-start gap-3 cursor-pointer p-3 border border-brand-navy-200 rounded-lg hover:border-brand-gold-400 transition-colors">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={e => setSendEmail(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-brand-navy-300 text-brand-gold-500 focus:ring-brand-gold-300"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy-900">
                <Send className="w-3.5 h-3.5 text-brand-gold-500" />
                Send notification email
              </div>
              <p className="text-xs text-brand-navy-500 mt-0.5">
                Optional. Email integration not yet active — for now the request is logged on the server.
              </p>
            </div>
          </label>
        </div>

        <div className="px-6 py-4 bg-brand-navy-50 border-t border-brand-navy-100 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-brand-navy-700 hover:bg-brand-navy-100 transition-colors cursor-pointer">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={submitting}
            className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 disabled:opacity-50 transition-colors cursor-pointer">
            {submitting ? "Deactivating..." : "Deactivate"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}


function DeleteModal({ user, onClose, onConfirm }) {
  const [typedEmail, setTypedEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const matches = typedEmail.trim().toLowerCase() === user.email.toLowerCase()

  const handleConfirm = async () => {
    setSubmitting(true)
    await onConfirm()
    setSubmitting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-red-100 bg-red-50 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-red-900">
                Delete user permanently?
              </h2>
              <p className="text-sm text-red-700 mt-0.5">
                {user.full_name || user.email}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-red-400 hover:text-red-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            <strong>This action cannot be undone.</strong> The user, their bookmarks,
            saved articles, folders, and all related data will be permanently deleted.
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-brand-navy-700 mb-2">
              Type the email <span className="text-red-600">{user.email}</span> to confirm
            </label>
            <input
              type="email"
              value={typedEmail}
              onChange={e => setTypedEmail(e.target.value)}
              autoFocus
              placeholder={user.email}
              className="w-full px-3 py-2 rounded-lg border border-brand-navy-200 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-300/40"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-brand-navy-50 border-t border-brand-navy-100 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-brand-navy-700 hover:bg-brand-navy-100 cursor-pointer">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={!matches || submitting}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
            {submitting ? "Deleting..." : "Delete permanently"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}


export default function AdminUsersPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toDeactivate, setToDeactivate] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [actionMsg, setActionMsg] = useState(null)

  const getHeaders = (extra = {}) => {
    const stored = JSON.parse(localStorage.getItem("banglabrief_auth") || "{}")
    const token = auth.token || stored.token
    return { "Authorization": `Bearer ${token}`, ...extra }
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API}/admin/users`, { headers: getHeaders() })
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      setUsers(await res.json())
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleDeactivate = async (sendEmail) => {
    try {
      const res = await fetch(`${API}/admin/users/${toDeactivate.id}/deactivate`, {
        method: "POST",
        headers: getHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ send_email: sendEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed")
      setActionMsg({ type: "success", text: `Deactivated ${data.email}${sendEmail ? " (email logged)" : ""}` })
      setToDeactivate(null)
      fetchUsers()
    } catch (e) {
      setActionMsg({ type: "error", text: e.message })
    }
  }

  const handleReactivate = async (user) => {
    try {
      const res = await fetch(`${API}/admin/users/${user.id}/reactivate`, {
        method: "POST",
        headers: getHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Failed")
      setActionMsg({ type: "success", text: `Reactivated ${data.email}` })
      fetchUsers()
    } catch (e) {
      setActionMsg({ type: "error", text: e.message })
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/admin/users/${toDelete.id}`, {
        method: "DELETE",
        headers: getHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Delete failed")
      setActionMsg({ type: "success", text: `Permanently deleted ${data.email}` })
      setToDelete(null)
      fetchUsers()
    } catch (e) {
      setActionMsg({ type: "error", text: e.message })
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <button type="button" onClick={() => navigate("/admin")}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-navy-500 hover:text-brand-gold-600 mb-4 cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin
      </button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-brand-navy-900 to-brand-navy-800 rounded-2xl p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-brand-gold-500/25 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-gold-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-brand-navy-950" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-brand-gold-300">All Users</div>
              <h1 className="font-display text-2xl font-bold text-white">{users.length} Registered Users</h1>
            </div>
          </div>
          <button type="button" onClick={fetchUsers}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </motion.div>

      {actionMsg && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3 rounded-lg flex items-center justify-between gap-2 text-sm ${
            actionMsg.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
          <span><AlertCircle className="w-4 h-4 inline mr-2" />{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-6">
          <AlertCircle className="w-4 h-4 inline mr-2" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-brand-navy-50 rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-brand-navy-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No users yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-navy-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-navy-50 border-b border-brand-navy-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-brand-navy-700">User</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-brand-navy-700 hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-brand-navy-700">Role</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-bold text-brand-navy-700">Status</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-widest font-bold text-brand-navy-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const initials = (u.full_name || u.email).split(/\s+|@/)[0].slice(0, 2).toUpperCase()
                const isMe = u.id === auth.user?.id
                return (
                  <motion.tr key={u.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className={`border-b border-brand-navy-50 hover:bg-brand-navy-50/50 ${!u.is_active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-gold-500 text-brand-navy-950 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-brand-navy-900 truncate">
                            {u.full_name || u.email.split("@")[0]}
                            {isMe && <span className="ml-2 text-[10px] uppercase tracking-widest text-brand-gold-600">(You)</span>}
                          </div>
                          <div className="text-xs text-brand-navy-500 truncate md:hidden">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-navy-700 hidden md:table-cell">
                      <Mail className="w-3 h-3 inline mr-1 text-brand-navy-300" />
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_admin ? (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-brand-gold-500 text-brand-navy-950">
                          <Shield className="w-2.5 h-2.5" /> Admin
                        </span>
                      ) : (
                        <span className="text-xs text-brand-navy-500">User</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active ? (
                        <span className="text-xs font-semibold text-green-600">Active</span>
                      ) : (
                        <span className="text-xs font-semibold text-red-600">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isMe ? (
                        <span className="text-xs text-brand-navy-300 italic">—</span>
                      ) : (
                        <div className="inline-flex items-center gap-3 justify-end">
                          {u.is_active ? (
                            <button type="button" onClick={() => setToDeactivate(u)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-800 cursor-pointer">
                              <UserX className="w-3.5 h-3.5" /> Deactivate
                            </button>
                          ) : (
                            <button type="button" onClick={() => handleReactivate(u)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-800 cursor-pointer">
                              <UserCheck className="w-3.5 h-3.5" /> Reactivate
                            </button>
                          )}
                          <button type="button" onClick={() => setToDelete(u)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {toDeactivate && (
          <DeactivateModal
            user={toDeactivate}
            onClose={() => setToDeactivate(null)}
            onConfirm={handleDeactivate}
          />
        )}
        {toDelete && (
          <DeleteModal
            user={toDelete}
            onClose={() => setToDelete(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
