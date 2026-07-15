const { getAuth } = require('firebase-admin/auth')

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }

  const idToken = authHeader.slice('Bearer '.length)

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken)

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || null,
    }

    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

module.exports = { authenticate }
