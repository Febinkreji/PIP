const { getAuth } = require('firebase-admin/auth')
const { assertRequiredFields } = require('../../../shared/validators/requiredFields')
const { assertValidEnum } = require('../../../shared/validators/enum')
const { ROLES } = require('../../../shared/constants/roles')

const REQUIRED_FIELDS = ['uid', 'role']

async function setUserRole({ uid, role }) {
  assertRequiredFields({ uid, role }, REQUIRED_FIELDS)
  assertValidEnum(role, ROLES, 'role')

  await getAuth().setCustomUserClaims(uid, { role })

  return { uid, role }
}

module.exports = { setUserRole }
