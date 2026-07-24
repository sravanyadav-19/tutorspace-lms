import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

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
    const { name, email, status, currentPassword, newPassword } = req.body
    const userId = parseInt(id)

    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own account'
      })
    }

    if (status && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update user status'
      })
    }

    // Password change flow
    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Both current and new password are required'
        })
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters'
        })
      }

      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      const passwordMatch = await bcrypt.compare(
        currentPassword,
        existingUser.passwordHash
      )

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        })
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12)

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword }
      })

      return res.json({
        success: true,
        message: 'Password updated successfully'
      })
    }

    // Email uniqueness check (normalized)
    const normalizedEmail = email ? normalizeEmail(email) : null
    if (normalizedEmail) {
      const existing = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
      })
      if (existing && existing.id !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        })
      }
    }

    // Admin approve/activate should also clear the email-verify gate so
    // approved students can sign in even if they never clicked the email link.
    const updateData = {
      ...(name && { name: String(name).trim() }),
      ...(normalizedEmail && { email: normalizedEmail }),
      ...(status && { status })
    }
    if (status === 'active' && req.user.role === 'admin') {
      updateData.emailVerified = true
      updateData.emailVerifyToken = null
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        emailVerified: true,
        role: {
          select: { name: true }
        }
      }
    })

    res.json({
      success: true,
      message: status === 'active'
        ? 'User approved successfully'
        : 'User updated successfully',
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

// DELETE USER - Admin Only
// DELETE /api/users/:id
// ================================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    const userId = parseInt(id)

    // Prevent deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      })
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    res.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    // Prisma P2003 = foreign key constraint violation
    if (error.code === 'P2003') {
      console.error('Delete user FK error:', error.message)
      return res.status(409).json({
        success: false,
        message: 'Cannot delete this user because they have existing records (enrollments, files, quizzes, etc.). Remove or reassign their related data first.'
      })
    }

    console.error('Delete user error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    })
  }
}

// ================================
// CREATE TEACHER - Admin Only
// POST /api/users/create-teacher
// ================================
export const createTeacher = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const password = req.body.password
    const name = String(req.body.name || '').trim()

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password and name are required'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      })
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    })
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      })
    }

    const teacherRole = await prisma.role.findUnique({
      where: { name: 'teacher' }
    })

    if (!teacherRole) {
      return res.status(500).json({
        success: false,
        message: 'Teacher role not found in database'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const teacher = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        roleId: teacherRole.id,
        status: 'active',
        emailVerified: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        role: { select: { name: true } }
      }
    })

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: { user: teacher }
    })
  } catch (error) {
    console.error('Create teacher error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create teacher'
    })
  }
}