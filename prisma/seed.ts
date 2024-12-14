import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Create test student
  const studentPassword = await bcrypt.hash('student123', 10)
  const student = await prisma.user.upsert({
    where: { username: 'student' },
    update: {},
    create: {
      firstName: 'Test',
      lastName: 'Student',
      username: 'student',
      password: studentPassword,
      role: 'STUDENT',
    },
  })

  console.log({ admin, student })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
