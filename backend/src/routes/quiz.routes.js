import express from 'express'
import {
  createQuiz,
  getClassQuizzes,
  getQuizById,
  togglePublishQuiz,
  deleteQuiz,
  getStudentQuizzes,
  getQuizForStudent,
  submitQuiz,
  getQuizSubmissions,
  releaseResults,
  getStudentResults
} from '../controllers/quiz.controller.js'
import { authenticate, authorize } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/', authenticate, authorize('teacher', 'admin'), createQuiz)
router.get('/class/:classId', authenticate, authorize('teacher', 'admin'), getClassQuizzes)
router.get('/student/all', authenticate, authorize('student'), getStudentQuizzes)
router.get('/student/results', authenticate, authorize('student'), getStudentResults)
router.get('/student/:quizId/take', authenticate, authorize('student'), getQuizForStudent)
router.post('/student/:quizId/submit', authenticate, authorize('student'), submitQuiz)
router.get('/:quizId', authenticate, getQuizById)
router.patch('/:quizId/publish', authenticate, authorize('teacher', 'admin'), togglePublishQuiz)
router.delete('/:quizId', authenticate, authorize('teacher', 'admin'), deleteQuiz)
router.get('/:quizId/submissions', authenticate, authorize('teacher', 'admin'), getQuizSubmissions)
router.patch('/:quizId/release', authenticate, authorize('teacher', 'admin'), releaseResults)

export default router
