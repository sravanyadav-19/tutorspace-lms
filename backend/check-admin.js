import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    // Check all users and their roles
    const users = await prisma.user.findMany({
      include: { role: true }
    })
    
    console.log('All users in database:')
    users.forEach(user => {
      console.log(`Email: ${user.email}, Role: ${user.role.name}, Status: ${user.status}`)
    })
    
    // Check specifically for admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@tutorspace.com' },
      include: { role: true }
    })
    
    if (admin) {
      console.log('\nAdmin user found:')
      console.log(`Role: ${admin.role.name}`)
      console.log(`Status: ${admin.status}`)
    } else {
      console.log('\nNo admin user found!')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()
