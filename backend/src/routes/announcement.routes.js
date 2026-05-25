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
import { validate } from '../middleware/validate.middleware.js'
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  createCommentSchema
} from '../schemas/validation.schema.js'

const router = express.Router()

router.get('/class/:classId', authenticate, getClassAnnouncements)
router.post('/class/:classId', authenticate, authorize('teacher', 'admin'), validate(createAnnouncementSchema), createAnnouncement)
router.put('/:id', authenticate, authorize('teacher', 'admin'), validate(updateAnnouncementSchema), updateAnnouncement)
router.delete('/:id', authenticate, authorize('teacher', 'admin'), deleteAnnouncement)
router.get('/:announcementId/comments', authenticate, getAnnouncementComments)
router.post('/:announcementId/comments', authenticate, validate(createCommentSchema), addComment)
router.delete('/comments/:commentId', authenticate, deleteComment)

export default router
