import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get all classes (Admin)
export const getAllClasses = async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        _count: {
          select: {
            enrollments: true,
            announcements: true,
            quizzes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.status(200).json({
      success: true,
      message: 'Classes retrieved successfully',
      data: { classes }
    })
  } catch (error) {
    console.error('Get classes error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve classes'
    })
  }
}

// Get classes for teacher
export const getTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.user.id

    const classes = await prisma.class.findMany({
      where: {
        enrollments: {
          some: {
            userId: teacherId,
            user: {
              role: {
                name: 'teacher'
              }
            }
          }
        }
      },
      include: {
        _count: {
          select: {
            enrollments: {
              where: {
                user: {
                  role: {
                    name: 'student'
                  }
                }
              }
            },
            announcements: true,
            quizzes: true
          }
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.status(200).json({
      success: true,
      message: 'Teacher classes retrieved successfully',
      data: { classes }
    })
  } catch (error) {
    console.error('Get teacher classes error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve teacher classes'
    })
  }
}

// Get single class details
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params
    
    const classData = await prisma.class.findUnique({
      where: { id: parseInt(id) },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        announcements: {
          include: {
            author: {
              select: {
                id: true,
                name: true
              }
            },
            _count: {
              select: {
                comments: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        quizzes: {
          include: {
            _count: {
              select: {
                questions: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            enrollments: true,
            announcements: true,
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

    res.status(200).json({
      success: true,
      message: 'Class details retrieved successfully',
      data: { class: classData }
    })
  } catch (error) {
    console.error('Get class error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve class details'
    })
  }
}

// Create new class (Admin)
export const createClass = async (req, res) => {
  try {
    const { name, subject, description } = req.body
    
    // Validation
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Class name is required'
      })
    }
    
    if (!subject?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required'
      })
    }

    // Check if class name already exists
    const existingClass = await prisma.class.findFirst({
      where: { 
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    })

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'Class with this name already exists'
      })
    }

    // Create class
    const newClass = await prisma.class.create({
      data: {
        name: name.trim(),
        subject: subject.trim(),
        description: description?.trim() || null,
        status: 'active',
        createdById: req.user.id
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            announcements: true,
            quizzes: true
          }
        }
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

// Update class (Admin)
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params
    const { name, subject, description, status } = req.body

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      })
    }

    // Validation
    if (name && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Class name cannot be empty'
      })
    }

    if (subject && !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject cannot be empty'
      })
    }

    // Check for name conflicts
    if (name && name.trim() !== existingClass.name) {
      const nameConflict = await prisma.class.findFirst({
        where: {
          name: {
            equals: name.trim(),
            mode: 'insensitive'
          },
          id: { not: parseInt(id) }
        }
      })

      if (nameConflict) {
        return res.status(400).json({
          success: false,
          message: 'Class with this name already exists'
        })
      }
    }

    // Update class
    const updatedClass = await prisma.class.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name: name.trim() }),
        ...(subject && { subject: subject.trim() }),
        ...(description !== undefined && { 
          description: description?.trim() || null 
        }),
        ...(status && { status })
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            announcements: true,
            quizzes: true
          }
        }
      }
    })

    res.status(200).json({
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

// Delete class with cascade (Admin) - FIXED!
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            enrollments: true,
            announcements: true,
            quizzes: true
          }
        }
      }
    })

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      })
    }

    // Delete in the correct order to avoid foreign key constraints
    
    // 1. Delete quiz submissions first
    await prisma.$executeRaw`
      DELETE FROM quiz_submissions 
      WHERE quiz_id IN (
        SELECT id FROM quizzes WHERE class_id = ${parseInt(id)}
      )
    `

    // 2. Delete quiz questions  
    await prisma.$executeRaw`
      DELETE FROM quiz_questions 
      WHERE quiz_id IN (
        SELECT id FROM quizzes WHERE class_id = ${parseInt(id)}
      )
    `

    // 3. Delete quizzes
    await prisma.quiz.deleteMany({
      where: { classId: parseInt(id) }
    })

    // 4. Delete announcement comments
    await prisma.$executeRaw`
      DELETE FROM announcement_comments 
      WHERE announcement_id IN (
        SELECT id FROM announcements WHERE class_id = ${parseInt(id)}
      )
    `

    // 5. Delete announcements
    await prisma.announcement.deleteMany({
      where: { classId: parseInt(id) }
    })

    // 6. Delete file uploads
    await prisma.file.deleteMany({
      where: { classId: parseInt(id) }
    })

    // 7. Delete class enrollments
    await prisma.classEnrollment.deleteMany({
      where: { classId: parseInt(id) }
    })

    // 8. Finally delete the class
    await prisma.class.delete({
      where: { id: parseInt(id) }
    })

    res.status(200).json({
      success: true,
      message: `Class "${existingClass.name}" deleted successfully`,
      data: {
        deletedClass: existingClass.name,
        deletedCounts: {
          enrollments: existingClass._count.enrollments,
          announcements: existingClass._count.announcements,
          quizzes: existingClass._count.quizzes
        }
      }
    })
  } catch (error) {
    console.error('Delete class error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete class'
    })
  }
}

// Enroll student in class (Admin)
export const enrollStudent = async (req, res) => {
  try {
    const { classId, userId } = req.params

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: parseInt(classId) }
    })

    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { role: true }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: {
        userId_classId: {
          userId: parseInt(userId),
          classId: parseInt(classId)
        }
      }
    })

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: `${user.name} is already enrolled in this class`
      })
    }

    // Create enrollment
    const enrollment = await prisma.classEnrollment.create({
      data: {
        userId: parseInt(userId),
        classId: parseInt(classId)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: { select: { name: true } }
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      message: `${user.name} enrolled successfully`,
      data: { enrollment }
    })
  } catch (error) {
    console.error('Enroll student error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to enroll student'
    })
  }
}

// Remove student from class (Admin)
export const removeStudent = async (req, res) => {
  try {
    const { classId, userId } = req.params

    // Check if enrollment exists
    const enrollment = await prisma.classEnrollment.findUnique({
      where: {
        userId_classId: {
          userId: parseInt(userId),
          classId: parseInt(classId)
        }
      },
      include: {
        user: { select: { name: true } },
        class: { select: { name: true } }
      }
    })

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      })
    }

    // Remove enrollment
    await prisma.classEnrollment.delete({
      where: {
        userId_classId: {
          userId: parseInt(userId),
          classId: parseInt(classId)
        }
      }
    })

    res.status(200).json({
      success: true,
      message: `${enrollment.user.name} removed from ${enrollment.class.name}`,
      data: { 
        removedUser: enrollment.user.name,
        fromClass: enrollment.class.name
      }
    })
  } catch (error) {
    console.error('Remove student error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to remove student from class'
    })
  }
}

// Get classes for student
export const getStudentClasses = async (req, res) => {
  try {
    const studentId = req.user.id

    const classes = await prisma.class.findMany({
      where: {
        enrollments: {
          some: {
            userId: studentId
          }
        }
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            announcements: true,
            quizzes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.status(200).json({
      success: true,
      message: 'Student classes retrieved successfully',
      data: { classes }
    })
  } catch (error) {
    console.error('Get student classes error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student classes'
    })
  }
}
