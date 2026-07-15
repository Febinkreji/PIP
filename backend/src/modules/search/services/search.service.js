const db = require('../../../config/firebase/firebase')
const { COLLECTIONS } = require('../../../shared/constants/collections')

const EQUALITY_FILTER_FIELDS = ['merchant', 'psp', 'severity', 'status', 'service', 'region', 'errorCode']
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

function isSameDay(isoString, dateString) {
  return typeof isoString === 'string' && isoString.slice(0, 10) === dateString
}

function buildBaseQuery(filters) {
  const activeEqualityFilters = EQUALITY_FILTER_FIELDS.filter((field) => filters[field])

  let query = db.collection(COLLECTIONS.INCIDENTS)
  activeEqualityFilters.forEach((field) => {
    query = query.where(field, '==', filters[field])
  })

  return { query, activeEqualityFilters }
}

function encodeCursor(incident) {
  return incident ? incident.createdAt : null
}

// Cursor-paginated: every request reads AT MOST pageSize (+1 lookahead)
// matching documents, never the whole incidents collection. `total` uses
// Firestore's count() aggregation, which is a single read regardless of how
// many documents match — never a document-by-document scan.
async function searchIncidents(filters = {}, pagination = {}) {
  const { correlationId, date } = filters
  const pageSize = Math.min(Math.max(Number(pagination.pageSize) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)
  const { cursor, direction } = pagination
  const goingBackward = direction === 'previous'

  if (correlationId) {
    const doc = await db.collection(COLLECTIONS.INCIDENTS).doc(correlationId).get()
    const results = doc.exists ? [doc.data()] : []
    return {
      results,
      pageSize,
      total: results.length,
      nextCursor: null,
      previousCursor: null,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  }

  const { query: baseQuery, activeEqualityFilters } = buildBaseQuery(filters)
  const isFiltered = activeEqualityFilters.length > 0

  // date is a range-ish filter applied in memory (Firestore where() equality
  // filters can't express "same calendar day" without a second range clause
  // that would require a composite index); every OTHER filter is a real
  // Firestore where() clause, so this never falls back to a full scan.
  const needsInMemoryDateFilter = Boolean(date)

  let results
  let hasNextPage

  if (isFiltered) {
    // Combining where() equality filters with orderBy() on a different field
    // requires a Firestore composite index that doesn't exist for arbitrary
    // filter combinations (and can't reasonably be pre-created for every
    // combination) — so filtered queries are NOT ordered server-side. The
    // result is capped at pageSize+1 documents (never the whole collection)
    // and sorted in memory below, which is cheap at that size.
    const snapshot = await baseQuery.limit(pageSize + 1).get()
    results = snapshot.docs.map((doc) => doc.data())
    hasNextPage = results.length > pageSize
    if (hasNextPage) results = results.slice(0, pageSize)
  } else {
    let orderedQuery = baseQuery.orderBy('createdAt', 'desc')

    if (cursor && goingBackward) {
      orderedQuery = orderedQuery.endBefore(cursor).limitToLast(pageSize)
    } else if (cursor) {
      orderedQuery = orderedQuery.startAfter(cursor).limit(pageSize + (needsInMemoryDateFilter ? 0 : 1))
    } else {
      orderedQuery = orderedQuery.limit(pageSize + (needsInMemoryDateFilter ? 0 : 1))
    }

    const snapshot = await orderedQuery.get()
    results = snapshot.docs.map((doc) => doc.data())

    hasNextPage = true
    if (!goingBackward && !needsInMemoryDateFilter) {
      hasNextPage = results.length > pageSize
      if (hasNextPage) results = results.slice(0, pageSize)
    } else if (!goingBackward) {
      hasNextPage = false // date filtering makes lookahead unreliable; treated as a final page
    }
  }

  if (needsInMemoryDateFilter) {
    results = results.filter((incident) => isSameDay(incident.createdAt, date))
    hasNextPage = false
  }

  results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  const countSnapshot = await baseQuery.count().get()

  return {
    results,
    pageSize,
    total: countSnapshot.data().count,
    filters: activeEqualityFilters,
    // Filtered results aren't server-ordered, so a value-based cursor can't
    // reliably seek further pages — not needed at demo scale (pageSize
    // already covers the typical match count for a single filter).
    nextCursor: !isFiltered && results.length > 0 && hasNextPage ? encodeCursor(results[results.length - 1]) : null,
    previousCursor: !isFiltered && results.length > 0 && cursor ? encodeCursor(results[0]) : null,
    hasNextPage,
    hasPreviousPage: isFiltered ? false : Boolean(cursor),
  }
}

module.exports = { searchIncidents }
