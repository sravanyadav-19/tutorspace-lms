import express from 'express'
import {
  getClassAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementComments,
  addComment,
  deleteComment
} from '../controllers/announcement.controller.js'
import { authenticate, authorize } from '../middleware/auth.middleware.js'

const router = express.Router()

// Anyone enrolled can view announcements
router.get('/class/:classId', authenticate, getClassAnnouncements)

// Teachers AND admins can create/update/delete
router.post('/class/:classId', authenticate, authorize('teacher', 'admin'), createAnnouncement)
router.put('/:id', authenticate, authorize('teacher', 'admin'), updateAnnouncement)
router.delete('/:id', authenticate, authorize('teacher', 'admin'), deleteAnnouncement)

// Anyone can comment
router.get('/:announcementId/comments', authenticate, getAnnouncementComments)
router.post('/:announcementId/comments', authenticate, addComment)
router.delete('/comments/:commentId', authenticate, deleteComment)

export default router
