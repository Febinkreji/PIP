import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="info-panel">Loading…</p>
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // The role custom claim is only set once an administrator runs
  // backend/scripts/setupRoles.js for this user — expected for a freshly
  // authenticated Google sign-in that has never been assigned a role.
  // Read straight off the already-fetched ID token result, no Firestore.
  if (!role) {
    return (
      <p className="info-panel">
        Your account has been authenticated successfully but has not yet been assigned a
        platform role. Please contact an administrator.
      </p>
    )
  }

  return children
}
