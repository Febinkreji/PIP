import { Route, Routes, Link, NavLink, useNavigate } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { IncidentDetails } from './pages/IncidentDetails'
import { Analytics } from './pages/Analytics'
import { LoginPage } from './pages/LoginPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import './App.css'

function UserMenu() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="user-menu">
      <span className="user-menu-email">{user.email}</span>
      {role && <span className="user-menu-role">{role}</span>}
      <button type="button" onClick={handleLogout}>
        Log out
      </button>
    </div>
  )
}

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-title">
          <span className="app-title-mark">PIP</span>
          <span className="app-title-full">Payment Incident Platform</span>
        </Link>
        <nav className="app-nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
        </nav>
        <UserMenu />
      </header>

      <main className="app-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incidents/:id"
            element={
              <ProtectedRoute>
                <IncidentDetails />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <footer className="app-footer">
        <span>PIP (Payment Incident Platform)</span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}

export default App
