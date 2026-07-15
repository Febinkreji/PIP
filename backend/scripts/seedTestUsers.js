require('../src/config/firebase/firebase')
const { getAuth } = require('firebase-admin/auth')

const TEST_PASSWORD = 'Password@123'

const TEST_USERS = [
  { email: 'admin@platform.com', role: 'ADMIN' },
  { email: 'engineer@platform.com', role: 'ENGINEER' },
  { email: 'manager@platform.com', role: 'MANAGER' },
  { email: 'viewer@platform.com', role: 'VIEWER' },
]

async function seedTestUsers() {
  for (const { email, role } of TEST_USERS) {
    let user

    try {
      user = await getAuth().getUserByEmail(email)
      console.log(`User ${email} already exists (${user.uid})`)
    } catch (error) {
      user = await getAuth().createUser({
        email,
        password: TEST_PASSWORD,
        emailVerified: true,
      })
      console.log(`Created user ${email} (${user.uid})`)
    }

    await getAuth().setCustomUserClaims(user.uid, { role })
    console.log(`Set role ${role} for ${email}`)
  }

  console.log(`\nAll test users use password: ${TEST_PASSWORD}`)
}

seedTestUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed test users:', error)
    process.exit(1)
  })
