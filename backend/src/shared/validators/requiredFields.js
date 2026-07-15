const { ValidationError } = require('../errors')

function assertRequiredFields(data, requiredFields) {
  const missingFields = requiredFields.filter((field) => !data[field])

  if (missingFields.length > 0) {
    throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`)
  }
}

module.exports = { assertRequiredFields }
