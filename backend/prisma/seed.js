import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // ================================
  // CREATE ROLES
  // ================================
  console.log('Creating roles...')

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      permissions: [
        'create_classes',
        'manage_users', 
        'view_all_data',
        'system_settings',
        'approve_users',
        'assign_classes'
      ]
    }
  })

  const teacherRole = await prisma.role.upsert({
    where: { name: 'teacher' },
    update: {},
    create: {
      name: 'teacher',
      permissions: [
        'manage_class_content',
        'grade_quizzes',
        'view_class_data',
        'post_announcements',
        'upload_files',
        'create_quizzes'
      ]
    }
  })

  const studentRole = await prisma.role.upsert({
    where: { name: 'student' },
    update: {},
    create: {
      name: 'student',
      permissions: [
        'view_classes',
        'take_quizzes',
        'comment_announcements',
        'download_files',
        'view_results'
      ]
    }
  })

  console.log('✅ Roles created:', adminRole.name, teacherRole.name, studentRole.name)

  // ================================
  // CREATE ADMIN USER
  // ================================
  console.log('Creating admin user...')

  const adminPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tutorspace.com' },
    update: {},
    create: {
      email: 'admin@tutorspace.com',
      passwordHash: adminPassword,
      name: 'Super Admin',
      roleId: adminRole.id,
      status: 'active',
      emailVerified: true
    }
  })

  console.log('✅ Admin created:', admin.email)

  // ================================
  // CREATE SAMPLE TEACHER
  // ================================
  console.log('Creating sample teacher...')

  const teacherPassword = await bcrypt.hash('teacher123', 12)

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@tutorspace.com' },
    update: {},
    create: {
      email: 'teacher@tutorspace.com',
      passwordHash: teacherPassword,
      name: 'Mr. Johnson',
      roleId: teacherRole.id,
      status: 'active',
      emailVerified: true
    }
  })

  console.log('✅ Teacher created:', teacher.email)

  // ================================
  // CREATE SAMPLE STUDENT
  // ================================
  console.log('Creating sample student...')

  const studentPassword = await bcrypt.hash('student123', 12)

  const student = await prisma.user.upsert({
    where: { email: 'student@tutorspace.com' },
    update: {},
    create: {
      email: 'student@tutorspace.com',
      passwordHash: studentPassword,
      name: 'Jane Smith',
      roleId: studentRole.id,
      status: 'active',
      emailVerified: true
    }
  })

  console.log('✅ Student created:', student.email)

  // ================================
  // CREATE SAMPLE CLASS
  // ================================
  console.log('Creating sample class...')

  const sampleClass = await prisma.class.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Introduction to Python',
      subject: 'Computer Science',
      description: 'Learn Python programming from the basics to advanced concepts',
      createdById: admin.id,
      approvedById: admin.id,
      status: 'active'
    }
  })

  console.log('✅ Class created:', sampleClass.name)

  // ================================
  // ENROLL USERS IN CLASS
  // ================================
  console.log('Enrolling users in class...')

  await prisma.classEnrollment.upsert({
    where: {
      userId_classId: {
        userId: teacher.id,
        classId: sampleClass.id
      }
    },
    update: {},
    create: {
      userId: teacher.id,
      classId: sampleClass.id
    }
  })

  await prisma.classEnrollment.upsert({
    where: {
      userId_classId: {
        userId: student.id,
        classId: sampleClass.id
      }
    },
    update: {},
    create: {
      userId: student.id,
      classId: sampleClass.id
    }
  })

  console.log('✅ Users enrolled in class!')

  console.log('')
  console.log('================================')
  console.log('🎉 DATABASE SEEDED SUCCESSFULLY!')
  console.log('================================')
  console.log('Test Accounts:')
  console.log('  Admin:   admin@tutorspace.com / admin123')
  console.log('  Teacher: teacher@tutorspace.com / teacher123')
  console.log('  Student: student@tutorspace.com / student123')
  console.log('================================')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
