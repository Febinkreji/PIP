// These extract the ACTUAL parsed JSON structure (not just validated text
// like utils/parseJsonField.js) because the dimension loader needs to read a
// specific nested field or iterate array elements, not pass the blob through
// to a JSONB column.

function extractStoreIdFromControlFunctions(rawValue) {
  if (!rawValue) return null

  try {
    const parsed = JSON.parse(rawValue)
    return parsed && typeof parsed.storeId === 'string' && parsed.storeId ? parsed.storeId : null
  } catch {
    return null
  }
}

function extractTerminalCodes(rawValue) {
  if (!rawValue) return []

  try {
    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((code) => typeof code === 'string' && code)
  } catch {
    return []
  }
}

module.exports = { extractStoreIdFromControlFunctions, extractTerminalCodes }
