import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ================================
// GET ALL USERS - Admin Only
// GET /api/users
// ================================
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        role: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      data: { users }
    })

  } catch (error) {
    console.error('Get all users error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    })
  }
}

// ================================
// GET USER BY ID
// GET /api/users/:id
// ================================
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        role: {
          select: { name: true }
        },
        enrollments: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                subject: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      data: { user }
    })

  } catch (error) {
    console.error('Get user by id error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    })
  }
}

// ================================
// UPDATE USER
// PUT /api/users/:id
// ================================
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { name, status } = req.body

    // Only admin can update status
    if (status && req.user.role.name !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update user status'
      })
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(status && { status })
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        role: {
          select: { name: true }
        }
      }
    })

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    })

  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    })
  }
}

// ================================
// DELETE USER - Admin Only
// DELETE /api/users/:id
// ================================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      })
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    })

    res.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    })
  }
}
