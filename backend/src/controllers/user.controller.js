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

// ================================
// DELETE USER - Admin Only
// DELETE /api/users/:id
// Optional force cascade:
//   DELETE /api/users/:id?force=true
//   or body: { force: true, confirmEmail: "user@email.com" }
// ================================

/**
 * Wipe every FK row that blocks deleting a user, then delete the user.
 * Runs inside a single transaction so a mid-way failure rolls back.
 */
async function forceDeleteUserCascade(userId, adminId) {
  return prisma.$transaction(async (tx) => {
    // --- Quiz activity as student ---
    const studentSubs = await tx.quizSubmission.findMany({
      where: { studentId: userId },
      select: { id: true }
    })
    const studentSubIds = studentSubs.map((s) => s.id)
    if (studentSubIds.length) {
      await tx.quizAnswer.deleteMany({ where: { submissionId: { in: studentSubIds } } })
      await tx.quizSubmission.deleteMany({ where: { id: { in: studentSubIds } } })
    }

    // Clear grader pointer (keep submissions, drop FK)
    await tx.quizSubmission.updateMany({
      where: { gradedById: userId },
      data: { gradedById: null }
    })

    // --- Quizzes created by this user (teacher) ---
    const createdQuizzes = await tx.quiz.findMany({
      where: { createdById: userId },
      select: { id: true }
    })
    const quizIds = createdQuizzes.map((q) => q.id)
    if (quizIds.length) {
      const quizSubs = await tx.quizSubmission.findMany({
        where: { quizId: { in: quizIds } },
        select: { id: true }
      })
      const quizSubIds = quizSubs.map((s) => s.id)
      if (quizSubIds.length) {
        await tx.quizAnswer.deleteMany({ where: { submissionId: { in: quizSubIds } } })
        await tx.quizSubmission.deleteMany({ where: { id: { in: quizSubIds } } })
      }

      // Delete answers tied to questions, then questions, then quizzes
      const questions = await tx.quizQuestion.findMany({
        where: { quizId: { in: quizIds } },
        select: { id: true }
      })
      const questionIds = questions.map((q) => q.id)
      if (questionIds.length) {
        await tx.quizAnswer.deleteMany({ where: { questionId: { in: questionIds } } })
        await tx.quizQuestion.deleteMany({ where: { id: { in: questionIds } } })
      }
      await tx.quiz.deleteMany({ where: { id: { in: quizIds } } })
    }

    // --- Announcements authored by user ---
    const announcements = await tx.announcement.findMany({
      where: { authorId: userId },
      select: { id: true }
    })
    const announcementIds = announcements.map((a) => a.id)
    if (announcementIds.length) {
      await tx.announcementComment.deleteMany({
        where: { announcementId: { in: announcementIds } }
      })
      await tx.announcement.deleteMany({ where: { id: { in: announcementIds } } })
    }

    // Comments left on other people's announcements
    await tx.announcementComment.deleteMany({ where: { authorId: userId } })

    // --- Files uploaded by user ---
    await tx.file.deleteMany({ where: { uploaderId: userId } })

    // --- Class enrollments ---
    await tx.classEnrollment.deleteMany({ where: { userId } })

    // --- Classes this user approved: drop pointer ---
    await tx.class.updateMany({
      where: { approvedById: userId },
      data: { approvedById: null }
    })

    // --- Classes this user created: reassign ownership to acting admin ---
    // (createdById is required — cannot null it)
    await tx.class.updateMany({
      where: { createdById: userId },
      data: { createdById: adminId }
    })

    // Finally remove the user row
    await tx.user.delete({ where: { id: userId } })
  }, { timeout: 30000 })
}

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    const userId = parseInt(id, 10)

    if (Number.isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id'
      })
    }

    // Prevent deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      })
    }

    const force =
      req.query.force === 'true' ||
      req.query.force === '1' ||
      req.body?.force === true ||
      req.body?.force === 'true'

    const target = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: { select: { name: true } } }
    })

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Never allow deleting admin accounts via this endpoint
    if (target.role?.name === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be deleted from User Management.'
      })
    }

    // Soft path first (no cascade)
    if (!force) {
      try {
        await prisma.user.delete({ where: { id: userId } })
        return res.json({
          success: true,
          message: 'User deleted successfully',
          data: { forced: false }
        })
      } catch (error) {
        if (error.code === 'P2003') {
          return res.status(409).json({
            success: false,
            code: 'USER_HAS_RELATED_DATA',
            message:
              'This user has related records (enrollments, files, quizzes, etc.). Use Force Delete to permanently remove the account and clean up their data.',
            data: {
              canForceDelete: true,
              user: {
                id: target.id,
                name: target.name,
                email: target.email,
                role: target.role?.name
              }
            }
          })
        }
        throw error
      }
    }

    // ---- FORCE DELETE (admin master action) ----
    // Require typing the target email so this cannot be a one-click accident
    const confirmEmail = normalizeEmail(
      req.body?.confirmEmail || req.query.confirmEmail || ''
    )
    if (!confirmEmail || confirmEmail !== normalizeEmail(target.email)) {
      return res.status(400).json({
        success: false,
        code: 'CONFIRM_EMAIL_REQUIRED',
        message:
          'Force delete requires confirmEmail to match the user email exactly.',
        data: { expectedEmail: target.email }
      })
    }

    await forceDeleteUserCascade(userId, req.user.id)

    return res.json({
      success: true,
      message: `Force deleted ${target.name} and cleaned up related records.`,
      data: {
        forced: true,
        deletedUser: {
          id: target.id,
          email: target.email,
          name: target.name
        }
      }
    })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user'
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