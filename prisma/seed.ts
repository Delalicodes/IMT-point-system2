import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
  });

  // Create test student
  const studentPassword = await bcrypt.hash('password123', 10)
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
  });

  // Create test course
  const course = await prisma.course.upsert({
    where: { code: 'COURSE_TEST' },
    update: {},
    create: {
      name: 'Test Course',
      code: 'COURSE_TEST',
      description: 'A test course for development',
      subjects: {
        create: [
          { name: 'Mathematics' },
          { name: 'Physics' },
          { name: 'Chemistry' }
        ]
      }
    },
    include: {
      subjects: true
    }
  });

  console.log({ admin, student, course });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
