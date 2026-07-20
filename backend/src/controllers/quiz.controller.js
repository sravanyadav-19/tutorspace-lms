import { prisma } from '../lib/prisma.js'

export const createQuiz = async (req, res) => {
  try {
    const { title, description, classId, timeLimit, questions } = req.body
    const teacherId = req.user.id

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        classId: parseInt(classId),
        createdById: teacherId,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        isPublished: false,
        questions: {
          create: (Array.isArray(questions) ? questions : []).map((q, index) => ({
            questionText: q.questionText,
            questionType: q.questionType || 'multiple_choice',
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswer: q.correctAnswer,
            points: q.points ? parseInt(q.points) : 1,
            orderNumber: index + 1
          }))
        }
      },
      include: {
        questions: true,
        class: { select: { name: true, subject: true } }
      }
    })

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: { quiz }
    })
  } catch (error) {
    console.error('Create quiz error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create quiz'
    })
  }
}

export const getClassQuizzes = async (req, res) => {
  try {
    const { classId } = req.params

    const quizzes = await prisma.quiz.findMany({
      where: { classId: parseInt(classId) },
      include: {
        _count: {
          select: {
            questions: true,
            submissions: true
          }
        },
        createdBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.status(200).json({
      success: true,
      data: { quizzes }
    })
  } catch (error) {
    console.error('Get class quizzes error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get quizzes'
    })
  }
}

export const getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params
    const userRole = req.user.role

    const quiz = await prisma.quiz.findUnique({
      where: { id: parseInt(quizId) },
      include: {
        questions: { orderBy: { orderNumber: 'asc' } },
        class: { select: { name: true, subject: true } },
        _count: { select: { submissions: true } }
      }
    })

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      })
    }

    // Strip correctAnswer from questions for non-teacher/admin users
    // (defense-in-depth — the route also has authorize('teacher', 'admin'))
    if (userRole !== 'teacher' && userRole !== 'admin') {
      quiz.questions = quiz.questions.map(q => {
        const { correctAnswer, ...rest } = q
        return rest
      })
    }

    res.status(200).json({
      success: true,
      data: { quiz }
    })
  } catch (error) {
    console.error('Get quiz error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get quiz'
    })
  }
}

export const togglePublishQuiz = async (req, res) => {
  try {
    const { quizId } = req.params
    const teacherId = req.user.id

    const quiz = await prisma.quiz.findUnique({
      where: { id: parseInt(quizId) }
    })

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      })
    }

    if (quiz.createdById !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'You can only publish your own quizzes'
      })
    }

    const updated = await prisma.quiz.update({
      where: { id: parseInt(quizId) },
      data: { isPublished: !quiz.isPublished }
    })

    res.status(200).json({
      success: true,
      message: updated.isPublished ? 'Quiz published!' : 'Quiz unpublished',
      data: { quiz: updated }
    })
  } catch (error) {
    console.error('Toggle publish error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update quiz'
    })
  }
}

export const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params
    const teacherId = req.user.id

    const quiz = await prisma.quiz.findUnique({
      where: { id: parseInt(quizId) }
    })

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      })
    }

    if (quiz.createdById !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own quizzes'
      })
    }

    await prisma.quizAnswer.deleteMany({
      where: {
        submission: { quizId: parseInt(quizId) }
      }
    })

    await prisma.quizSubmission.deleteMany({
      where: { quizId: parseInt(quizId) }
    })

    await prisma.quizQuestion.deleteMany({
      where: { quizId: parseInt(quizId) }
    })

    await prisma.quiz.delete({
      where: { id: parseInt(quizId) }
    })

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully'
    })
  } catch (error) {
    console.error('Delete quiz error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete quiz'
    })
  }
}

export const getStudentQuizzes = async (req, res) => {
  try {
    const studentId = req.user.id

    const enrollments = await prisma.classEnrollment.findMany({
      where: { userId: studentId },
      select: { classId: true }
    })

    const classIds = enrollments.map(e => e.classId)

    const quizzes = await prisma.quiz.findMany({
      where: {
        classId: { in: classIds },
        isPublished: true
      },
      include: {
        class: { select: { name: true, subject: true } },
        _count: { select: { questions: true } },
        submissions: {
          where: { studentId },
          select: {
            id: true,
            score: true,
            totalPoints: true,
            submittedAt: true,
            isReleased: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.status(200).json({
      success: true,
      data: { quizzes }
    })
  } catch (error) {
    console.error('Get student quizzes error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get quizzes'
    })
  }
}

export const getQuizForStudent = async (req, res) => {
  try {
    const { quizId } = req.params
    const studentId = req.user.id

    const quiz = await prisma.quiz.findUnique({
      where: {
        id: parseInt(quizId),
        isPublished: true
      },
      include: {
        questions: {
          orderBy: { orderNumber: 'asc' },
          select: {
            id: true,
            questionText: true,
            questionType: true,
            options: true,
            points: true,
            orderNumber: true
          }
        },
        class: { select: { name: true, subject: true } }
      }
    })

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or not published'
      })
    }

    const existingSubmission = await prisma.quizSubmission.findUnique({
      where: {
        quizId_studentId: {
          quizId: parseInt(quizId),
          studentId
        }
      }
    })

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this quiz'
      })
    }

    res.status(200).json({
      success: true,
      data: { quiz }
    })
  } catch (error) {
    console.error('Get quiz for student error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get quiz'
    })
  }
}

export const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params
    const studentId = req.user.id
    const { answers } = req.body

    const quiz = await prisma.quiz.findUnique({
      where: {
        id: parseInt(quizId),
        isPublished: true
      },
      include: { questions: true }
    })

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      })
    }

    const existing = await prisma.quizSubmission.findUnique({
      where: {
        quizId_studentId: {
          quizId: parseInt(quizId),
          studentId
        }
      }
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this quiz'
      })
    }

    let totalScore = 0
    let totalPoints = 0

    const gradedAnswers = (Array.isArray(answers) ? answers : []).map(answer => {
      const question = quiz.questions.find(
        q => q.id === parseInt(answer.questionId)
      )

      if (!question) return null

      const isCorrect = answer.studentAnswer.trim().toLowerCase() ===
        question.correctAnswer.trim().toLowerCase()

      const pointsEarned = isCorrect ? question.points : 0
      totalScore += pointsEarned
      totalPoints += question.points

      return {
        questionId: parseInt(answer.questionId),
        studentAnswer: answer.studentAnswer,
        isCorrect,
        pointsEarned
      }
    }).filter(Boolean)

    const submission = await prisma.quizSubmission.create({
      data: {
        quizId: parseInt(quizId),
        studentId,
        score: totalScore,
        totalPoints,
        submittedAt: new Date(),
        gradedAt: new Date(),
        isReleased: false,
        answers: { create: gradedAnswers }
      },
      include: { answers: true }
    })

    res.status(201).json({
      success: true,
      message: 'Quiz submitted successfully!',
      data: {
        submission: {
          id: submission.id,
          score: submission.score,
          totalPoints: submission.totalPoints,
          submittedAt: submission.submittedAt
        }
      }
    })
  } catch (error) {
    console.error('Submit quiz error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz'
    })
  }
}

export const getQuizSubmissions = async (req, res) => {
  try {
    const { quizId } = req.params

    const submissions = await prisma.quizSubmission.findMany({
      where: { quizId: parseInt(quizId) },
      include: {
        student: { select: { id: true, name: true, email: true } },
        answers: {
          include: {
            question: {
              select: { questionText: true, points: true }
            }
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    res.status(200).json({
      success: true,
      data: { submissions }
    })
  } catch (error) {
    console.error('Get submissions error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get submissions'
    })
  }
}

export const releaseResults = async (req, res) => {
  try {
    const { quizId } = req.params

    await prisma.quizSubmission.updateMany({
      where: { quizId: parseInt(quizId) },
      data: { isReleased: true }
    })

    res.status(200).json({
      success: true,
      message: 'Results released to all students!'
    })
  } catch (error) {
    console.error('Release results error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to release results'
    })
  }
}

export const getStudentResults = async (req, res) => {
  try {
    const studentId = req.user.id

    const submissions = await prisma.quizSubmission.findMany({
      where: {
        studentId,
        isReleased: true
      },
      include: {
        quiz: {
          select: {
            title: true,
            class: { select: { name: true, subject: true } }
          }
        },
        answers: {
          include: {
            question: {
              select: {
                questionText: true,
                correctAnswer: true,
                points: true
              }
            }
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    res.status(200).json({
      success: true,
      data: { submissions }
    })
  } catch (error) {
    console.error('Get student results error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get results'
    })
  }
}