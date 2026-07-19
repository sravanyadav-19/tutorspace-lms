import { prisma } from '../lib/prisma.js'

/**
 * Check that the requesting user has access to a class.
 * Allowed if:
 *   - user is admin, OR
 *   - user is enrolled in the class (teacher or student)
 */
async function checkClassAccess(userId, userRole, classId) {
  if (userRole === 'admin') {
    return true
  }

  const enrollment = await prisma.classEnrollment.findUnique({
    where: {
      userId_classId: {
        userId,
        classId: parseInt(classId)
      }
    }
  })

  return !!enrollment
}

// Get announcements for a class
export const getClassAnnouncements = async (req, res) => {
  try {
    const { classId } = req.params
    const userId = req.user.id
    const userRole = req.user.role

    // Check enrollment
    const hasAccess = await checkClassAccess(userId, userRole, classId)
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this class'
      })
    }

    const announcements = await prisma.announcement.findMany({
      where: {
        classId: parseInt(classId)
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: {
              select: { name: true }
            }
          }
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.status(200).json({
      success: true,
      message: 'Announcements retrieved successfully',
      data: { announcements }
    })
  } catch (error) {
    console.error('Get announcements error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve announcements'
    })
  }
}

// Create announcement (Teacher only)
export const createAnnouncement = async (req, res) => {
  try {
    const { classId } = req.params
    const { title, content } = req.body
    const teacherId = req.user.id

    // Validation
    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Announcement title is required'
      })
    }

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Announcement content is required'
      })
    }

    // Create announcement using correct schema field names
    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        classId: parseInt(classId),
        authorId: teacherId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: {
              select: { name: true }
            }
          }
        },
        _count: {
          select: { comments: true }
        }
      }
    })

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: { announcement }
    })
  } catch (error) {
    console.error('Create announcement error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement'
    })
  }
}

// Update announcement
export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params
    const { title, content } = req.body
    const userId = req.user.id

    const existing = await prisma.announcement.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      })
    }

    if (existing.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own announcements'
      })
    }

    const updated = await prisma.announcement.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title: title.trim() }),
        ...(content && { content: content.trim() })
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: { select: { name: true } }
          }
        },
        _count: {
          select: { comments: true }
        }
      }
    })

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: { announcement: updated }
    })
  } catch (error) {
    console.error('Update announcement error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update announcement'
    })
  }
}

// Delete announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const existing = await prisma.announcement.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      })
    }

    if (existing.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own announcements'
      })
    }

    // Delete comments first
    await prisma.announcementComment.deleteMany({
      where: { announcementId: parseInt(id) }
    })

    await prisma.announcement.delete({
      where: { id: parseInt(id) }
    })

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    })
  } catch (error) {
    console.error('Delete announcement error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement'
    })
  }
}

// Get comments for an announcement
export const getAnnouncementComments = async (req, res) => {
  try {
    const { announcementId } = req.params

    const comments = await prisma.announcementComment.findMany({
      where: {
        announcementId: parseInt(announcementId)
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    res.status(200).json({
      success: true,
      message: 'Comments retrieved successfully',
      data: { comments }
    })
  } catch (error) {
    console.error('Get comments error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve comments'
    })
  }
}

// Add comment
export const addComment = async (req, res) => {
  try {
    const { announcementId } = req.params
    const { content } = req.body
    const userId = req.user.id
    const userRole = req.user.role

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      })
    }

    // Find the announcement to get its classId for enrollment check
    const announcement = await prisma.announcement.findUnique({
      where: { id: parseInt(announcementId) },
      select: { classId: true }
    })

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      })
    }

    // Check enrollment in the announcement's class
    const hasAccess = await checkClassAccess(userId, userRole, announcement.classId)
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this class'
      })
    }

    const comment = await prisma.announcementComment.create({
      data: {
        commentText: content.trim(),
        announcementId: parseInt(announcementId),
        authorId: userId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: { select: { name: true } }
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment }
    })
  } catch (error) {
    console.error('Add comment error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    })
  }
}

// Delete comment
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const userId = req.user.id

    const existing = await prisma.announcementComment.findUnique({
      where: { id: parseInt(commentId) }
    })

    // Return 404 for BOTH "not found" AND "not owned" so non-owners
    // cannot distinguish whether a commentId exists or not.
    if (!existing || existing.authorId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    await prisma.announcementComment.delete({
      where: { id: parseInt(commentId) }
    })

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    console.error('Delete comment error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment'
    })
  }
}