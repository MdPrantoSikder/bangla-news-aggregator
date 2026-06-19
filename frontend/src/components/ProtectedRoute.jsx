import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Loader2 } from "lucide-react"


/**
 * Wraps any route that requires authentication.
 *
 * Usage:
 *   <Route path="/study-space" element={
 *     <ProtectedRoute><StudySpacePage /></ProtectedRoute>
 *   } />
 *
 * Props:
 *   - children: the page to render if authenticated
 *   - requireAdmin: if true, also requires user.is_admin
 */
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isLoggedIn, isAdmin, loading } = useAuth()
  const location = useLocation()

  // While we validate the stored token via /auth/me, show a brief loader.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-brand-navy-500">
          <Loader2 className="w-5 h-5 animate-spin text-brand-gold-500" />
          <span className="text-sm font-semibold">Loading...</span>
        </div>
      </div>
    )
  }

  // Not logged in → redirect to /login, remembering where we came from.
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Logged in but not an admin → 403-style screen.
  if (requireAdmin && !isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h1 className="font-display text-2xl font-bold text-brand-navy-900 mb-2">
          Access denied
        </h1>
        <p className="text-sm text-brand-navy-500">
          You need administrator privileges to view this page.
        </p>
      </div>
    )
  }

  return children
}
