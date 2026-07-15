import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

export function LoginPage() {
  const { user, loading, login, firebaseConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from || '/'

  // Navigate only once AuthContext has fully resolved the signed-in user (and
  // its role claim) rather than immediately after the login() promise
  // resolves — those two are not the same moment, and navigating too early
  // sends ProtectedRoute a stale `user: null` that bounces back to /login.
  // This also covers a user landing on /login while already authenticated.
  useEffect(() => {
    if (!loading && user) {
      navigate(redirectTo, { replace: true })
    }
  }, [user, loading, redirectTo, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login(email, password)
      // No navigation here — the effect above handles it once the auth
      // state (including the role claim) has actually finished loading.
    } catch {
      setError('Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>PIP (Payment Incident Platform)</h1>
        <p className="login-subtitle">Sign in to continue</p>

        {!firebaseConfigured && (
          <p className="login-error">
            Firebase Authentication is not configured. Set the VITE_FIREBASE_* variables in
            frontend/.env (see .env.example) and restart the dev server.
          </p>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!firebaseConfigured}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!firebaseConfigured}
            required
          />
        </label>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" disabled={!firebaseConfigured || submitting}>
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
