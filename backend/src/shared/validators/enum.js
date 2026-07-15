const { ValidationError } = require('../errors')

function assertValidEnum(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `Invalid ${fieldName}. Must be one of: ${allowedValues.join(', ')}`
    )
  }
}

module.exports = { assertValidEnum }
