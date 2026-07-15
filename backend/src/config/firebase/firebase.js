const fs = require('fs')
const path = require('path')
const { initializeApp, getApps, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

function loadServiceAccount() {
  // Production (Render, etc.): the JSON file is git-ignored and never
  // deployed, so the key is supplied via env var instead — either the raw
  // JSON or a base64-encoded copy of it.
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim()
    const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
    return JSON.parse(json)
  }

  // Local dev: drop the downloaded service account JSON into this folder.
  const serviceAccountFile = fs
    .readdirSync(__dirname)
    .find((file) => file.endsWith('.json'))

  if (!serviceAccountFile) {
    throw new Error(
      'Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT (production) or place the service account JSON in backend/src/config/firebase/ (local dev).'
    )
  }

  return require(path.join(__dirname, serviceAccountFile))
}

if (!getApps().length) {
  initializeApp({
    credential: cert(loadServiceAccount()),
  })
}

const db = getFirestore()

module.exports = db
