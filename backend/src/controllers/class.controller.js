import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ================================
// GET ALL CLASSES
// GET /api/classes
// ================================
export const getAllClasses = async (req, res) => {
  try {
    const { role, id: userId } = req.user

    let classes

    if (role.name === 'admin') {
      // Admin sees ALL classes
      classes = await prisma.class.findMany({
        include: {
          createdBy: {
            select: { name: true, email: true }
          },
          _count: {
            select: { enrollments: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      // Teachers and Students see only enrolled classes
      classes = await prisma.class.findMany({
        where: {
          enrollments: {
            some: { userId }
          }
        },
        include: {
          createdBy: {
            select: { name: true }
          },
          _count: {
            select: { enrollments: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    res.json({
      success: true,
      data: { classes }
    })

  } catch (error) {
    console.error('Get all classes error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch classes'
    })
  }
}

// ================================
// GET CLASS BY ID
// GET /api/classes/:id
// ================================
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params

    const classData = await prisma.class.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdBy: {
          select: { name: true, email: true }
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: { select: { name: true } }
              }
            }
          }
        },
        announcements: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            enrollments: true,
            announcements: true,
            files: true,
            quizzes: true
          }
        }
      }
    })

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      })
    }

    res.json({
      success: true,
      data: { class: classData }
    })

  } catch (error) {
    console.error('Get class by id error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class'
    })
  }
}

// ================================
// CREATE CLASS - Admin Only
// POST /api/classes
// ================================
export const createClass = async (req, res) => {
  try {
    const { name, subject, description } = req.body
    const adminId = req.user.id

    if (!name || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Class name and subject are required'
      })
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        subject,
        description,
        createdById: adminId,
        approvedById: adminId,
        status: 'active'
      }
    })

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: { class: newClass }
    })

  } catch (error) {
    console.error('Create class error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create class'
    })
  }
}

// ================================
// UPDATE CLASS - Admin Only
// PUT /api/classes/:id
// ================================
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params
    const { name, subject, description, status } = req.body

    const updatedClass = await prisma.class.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(subject && { subject }),
        ...(description && { description }),
        ...(status && { status })
      }
    })

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: { class: updatedClass }
    })

  } catch (error) {
    console.error('Update class error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update class'
    })
  }
}

// ================================
// DELETE CLASS - Admin Only
// DELETE /api/classes/:id
// ================================
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.class.delete({
      where: { id: parseInt(id) }
    })

    res.json({
      success: true,
      message: 'Class deleted successfully'
    })

  } catch (error) {
    console.error('Delete class error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete class'
    })
  }
}

// ================================
// ENROLL STUDENT - Admin Only
// POST /api/classes/:id/enroll
// ================================
export const enrollStudent = async (req, res) => {
  try {
    const { id: classId } = req.params
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      })
    }

    // Check if already enrolled
    const existing = await prisma.classEnrollment.findUnique({
      where: {
        userId_classId: {
          userId: parseInt(userId),
          classId: parseInt(classId)
        }
      }
    })

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'User is already enrolled in this class'
      })
    }

    const enrollment = await prisma.classEnrollment.create({
      data: {
        userId: parseInt(userId),
        classId: parseInt(classId)
      }
    })

    res.status(201).json({
      success: true,
      message: 'User enrolled successfully',
      data: { enrollment }
    })

  } catch (error) {
    console.error('Enroll student error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to enroll user'
    })
  }
}
