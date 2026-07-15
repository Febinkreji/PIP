const CACHE_TTL_MS = 30 * 1000

// A tiny per-key TTL cache used ONLY for precomputed aggregate documents
// (dashboardStats/current, analyticsSummary/current). It must never be used
// for individual incident/investigation/recommendation documents — those are
// mutable entities that callers always need fresh.
const entries = new Map()
const inFlight = new Map()

async function getCached(key, fetcher) {
  const now = Date.now()
  const entry = entries.get(key)

  if (entry && now - entry.cachedAt < CACHE_TTL_MS) {
    return entry.value
  }

  const existingFetch = inFlight.get(key)
  if (existingFetch) {
    return existingFetch
  }

  const fetchPromise = fetcher()
    .then((value) => {
      entries.set(key, { value, cachedAt: Date.now() })
      inFlight.delete(key)
      return value
    })
    .catch((error) => {
      inFlight.delete(key)
      throw error
    })

  inFlight.set(key, fetchPromise)
  return fetchPromise
}

function invalidate(key) {
  entries.delete(key)
}

function invalidateAggregateCache() {
  entries.clear()
}

module.exports = { getCached, invalidate, invalidateAggregateCache }
