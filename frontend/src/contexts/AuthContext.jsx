import { createContext, useContext, useEffect, useState, useCallback } from "react"


const AUTH_STORAGE_KEY = "banglabrief_auth"
const API_BASE_URL = "http://localhost:8000"


const AuthContext = createContext(null)


/**
 * Load auth state from localStorage on first render.
 */
function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}


/**
 * Save auth state to localStorage so the user stays logged in across refreshes.
 */
function saveAuth(auth) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
  } catch {
    console.error("Failed to persist auth state")
  }
}


function clearStoredAuth() {
  try { localStorage.removeItem(AUTH_STORAGE_KEY) }
  catch {}
}


/**
 * Auth provider. Wrap the app in this to make `useAuth()` available everywhere.
 */
export function AuthProvider({ children }) {
  // Initialize from localStorage so the user stays logged in across refreshes.
  const [auth, setAuth]       = useState(() => loadStoredAuth())
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // On mount, validate the stored token by calling /auth/me. If invalid, sign out.
  useEffect(() => {
    if (!auth?.token) {
      setLoading(false)
      return
    }
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Session expired")
        const user = await res.json()
        // Refresh user data in case it changed server-side
        const updated = { ...auth, user }
        setAuth(updated)
        saveAuth(updated)
      })
      .catch(() => {
        clearStoredAuth()
        setAuth(null)
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const signup = useCallback(async ({ email, password, full_name }) => {
    setError(null)
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password, full_name }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const msg = data.detail || `Signup failed (${res.status})`
      setError(msg)
      throw new Error(msg)
    }
    const data = await res.json()
    const next = { token: data.access_token, user: data.user }
    setAuth(next)
    saveAuth(next)
    return data.user
  }, [])


  const login = useCallback(async ({ email, password }) => {
    setError(null)
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const msg = data.detail || `Login failed (${res.status})`
      setError(msg)
      throw new Error(msg)
    }
    const data = await res.json()
    const next = { token: data.access_token, user: data.user }
    setAuth(next)
    saveAuth(next)
    return data.user
  }, [])


  const logout = useCallback(() => {
    clearStoredAuth()
    setAuth(null)
    setError(null)
  }, [])


  const value = {
    user:     auth?.user || null,
    token:    auth?.token || null,
    isLoggedIn: !!auth?.token,
    isAdmin:    !!auth?.user?.is_admin,
    loading,
    error,
    signup,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


/**
 * Hook to access auth state and actions from any component.
 *
 * Example:
 *   const { user, isLoggedIn, login, logout } = useAuth()
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>")
  }
  return ctx
}
