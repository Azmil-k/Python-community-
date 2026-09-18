const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const isProduction = process.env.NODE_ENV === 'production'
  const hasForceFlag = process.argv.includes('--force')

  if (isProduction && !hasForceFlag) {
    throw new Error(
      'Refusing to seed database in production mode without explicit --force flag!'
    )
  }

  console.warn(
    'WARNING: Seeding default dev-only credentials (password: password123). These MUST be rotated before any shared or staging/production use.'
  )

  const passwordHash = await bcrypt.hash('password123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {
      name: 'Admin User',
      role: 'ADMIN',
      password: passwordHash,
    },
    create: {
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'ADMIN',
      password: passwordHash,
    },
  })

  await prisma.user.upsert({
    where: { email: 'mentor@test.com' },
    update: {
      name: 'Mentor User',
      role: 'MENTOR',
      password: passwordHash,
    },
    create: {
      email: 'mentor@test.com',
      name: 'Mentor User',
      role: 'MENTOR',
      password: passwordHash,
    },
  })

  await prisma.user.upsert({
    where: { email: 'student@test.com' },
    update: {
      name: 'Student User',
      role: 'STUDENT',
      password: passwordHash,
    },
    create: {
      email: 'student@test.com',
      name: 'Student User',
      role: 'STUDENT',
      password: passwordHash,
    },
  })

  console.log('Database seeded with admin@test.com, mentor@test.com, student@test.com')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
