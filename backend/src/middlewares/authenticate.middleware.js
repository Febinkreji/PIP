const { getAuth } = require('firebase-admin/auth')

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }

  const idToken = authHeader.slice('Bearer '.length)

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken)

    // DEMO FALLBACK — remove once every account has a real role assigned via
    // backend/scripts/setupRoles.js. An authenticated user with no `role`
    // custom claim (e.g. a first-time Google sign-in) is treated as a
    // read-only VIEWER for this request only: no custom claim is ever set,
    // nothing is written to Firestore, and requireRole(...) below still
    // rejects VIEWER from every write/admin endpoint exactly as it does for
    // a real VIEWER account.
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'VIEWER',
    }

    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

module.exports = { authenticate }
