// Records a key -> value association (store_id -> merchant_id, or
// terminal_id -> merchant_id/store_id) discovered while scanning source
// rows, with a "trust tier" per source (lower number = more trusted).
//
// - A value from a MORE trusted tier always overrides an existing value from
//   a LESS trusted tier — silently, since that's the whole point of having
//   tiers, not a data problem.
// - A value that disagrees with an existing value from the SAME tier is a
//   genuine, unresolvable ambiguity — the first-seen value is kept, and the
//   disagreement is pushed onto `conflicts` so it's never silently lost.
// - A value from a LESS trusted tier that disagrees with an existing
//   more-trusted value is ignored silently — expected, not a conflict.
function recordAssociation({ valueMap, tierMap, conflicts, dimension, sourceFile, rowIndex, key, value, tier }) {
  if (!key || !value) return

  const existingValue = valueMap.get(key)
  const existingTier = tierMap.get(key)

  if (existingValue === undefined) {
    valueMap.set(key, value)
    tierMap.set(key, tier)
    return
  }

  if (existingValue === value) return

  if (tier < existingTier) {
    valueMap.set(key, value)
    tierMap.set(key, tier)
  } else if (tier === existingTier) {
    conflicts.push({
      dimension,
      sourceFile,
      rowIndex,
      message: `${key}: conflicting association — kept "${existingValue}", also saw "${value}" from an equally-trusted source`,
    })
  }
  // tier > existingTier: a less-trusted source disagreeing with an
  // already-trusted value. Ignored on purpose, not logged.
}

module.exports = { recordAssociation }
