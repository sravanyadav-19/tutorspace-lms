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

router.get('/class/:classId', authenticate, getClassAnnouncements)
router.post('/class/:classId', authenticate, authorize('teacher'), createAnnouncement)
router.put('/:id', authenticate, authorize('teacher'), updateAnnouncement)
router.delete('/:id', authenticate, authorize('teacher'), deleteAnnouncement)
router.get('/:announcementId/comments', authenticate, getAnnouncementComments)
router.post('/:announcementId/comments', authenticate, addComment)
router.delete('/comments/:commentId', authenticate, deleteComment)

export default router
