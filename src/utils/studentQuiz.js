/**
 * Student quiz status helpers
 *
 * States a student can see:
 *  - ready            → published, not submitted → can start
 *  - awaiting_release → submitted, teacher has not released grades
 *  - graded           → submitted + isReleased → can view results
 */

export const QUIZ_STATUS = {
  READY: 'ready',
  AWAITING_RELEASE: 'awaiting_release',
  GRADED: 'graded'
}

/** First submission for this student (API returns submissions[] filtered to them) */
export const getSubmission = (quiz) => {
  if (!quiz) return null
  if (Array.isArray(quiz.submissions) && quiz.submissions.length > 0) {
    return quiz.submissions[0]
  }
  // Some payloads may nest a single submission
  if (quiz.submission) return quiz.submission
  return null
}

/**
 * @returns {'ready' | 'awaiting_release' | 'graded'}
 */
export const getStudentQuizStatus = (quiz) => {
  const submission = getSubmission(quiz)
  if (!submission) return QUIZ_STATUS.READY
  if (submission.isReleased) return QUIZ_STATUS.GRADED
  return QUIZ_STATUS.AWAITING_RELEASE
}

export const isReadyToTake = (quiz) => getStudentQuizStatus(quiz) === QUIZ_STATUS.READY
export const isSubmitted = (quiz) => getStudentQuizStatus(quiz) !== QUIZ_STATUS.READY
export const isGraded = (quiz) => getStudentQuizStatus(quiz) === QUIZ_STATUS.GRADED
export const isAwaitingRelease = (quiz) =>
  getStudentQuizStatus(quiz) === QUIZ_STATUS.AWAITING_RELEASE

export const countByStatus = (quizzes = []) => {
  const counts = {
    total: quizzes.length,
    ready: 0,
    awaitingRelease: 0,
    graded: 0,
    submitted: 0
  }
  quizzes.forEach((q) => {
    const status = getStudentQuizStatus(q)
    if (status === QUIZ_STATUS.READY) counts.ready += 1
    if (status === QUIZ_STATUS.AWAITING_RELEASE) {
      counts.awaitingRelease += 1
      counts.submitted += 1
    }
    if (status === QUIZ_STATUS.GRADED) {
      counts.graded += 1
      counts.submitted += 1
    }
  })
  return counts
}

export const STATUS_LABELS = {
  [QUIZ_STATUS.READY]: 'Ready to take',
  [QUIZ_STATUS.AWAITING_RELEASE]: 'Awaiting release',
  [QUIZ_STATUS.GRADED]: 'Graded'
}
