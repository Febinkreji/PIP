import { createContext, useContext, useEffect, useState } from 'react'
import { signInWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, firebaseConfigured, googleProvider } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const tokenResult = await firebaseUser.getIdTokenResult(true)
        setUser(firebaseUser)
        setRole(tokenResult.claims.role || null)
      } else {
        setUser(null)
        setRole(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // Popup-only — on success this resolves and the onAuthStateChanged
  // listener above (already subscribed) picks up the new user and role
  // claim exactly as it does for email/password sign-in. No separate
  // authentication flow, no manual backend call.
  function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider)
  }

  function logout() {
    return signOut(auth)
  }

  const value = { user, role, loading, login, loginWithGoogle, logout, firebaseConfigured }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
