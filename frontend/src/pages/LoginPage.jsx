import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

// Friendly copy for the Google popup failure modes called out in the spec —
// everything else falls back to a generic message. Never thrown, never
// retried automatically; the user can just click the button again.
function googleSignInErrorMessage(code) {
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled.'
    case 'auth/network-request-failed':
      return 'Network error during Google sign-in. Check your connection and try again.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google Sign-In. Please contact an administrator.'
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup. Please allow popups for this site and try again.'
    default:
      return 'Google sign-in failed. Please try again.'
  }
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.68-3.87 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
    </svg>
  )
}

export function LoginPage() {
  const { user, loading, login, loginWithGoogle, firebaseConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

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

  async function handleGoogleSignIn() {
    setError('')
    setGoogleSubmitting(true)

    try {
      await loginWithGoogle()
      // No navigation here either — same reasoning as email/password above,
      // and no manual backend call: the existing onAuthStateChanged
      // listener in AuthContext picks up the new user automatically.
    } catch (err) {
      setError(googleSignInErrorMessage(err?.code))
    } finally {
      setGoogleSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <form onSubmit={handleSubmit}>
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

        <div className="login-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="login-google-button"
          onClick={handleGoogleSignIn}
          disabled={!firebaseConfigured || googleSubmitting}
        >
          <GoogleIcon />
          {googleSubmitting ? 'Signing in…' : 'Continue with Google'}
        </button>
      </div>
    </div>
  )
}
