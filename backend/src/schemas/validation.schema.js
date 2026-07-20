import { z } from 'zod'

const emailSchema = z.string().email('Please provide a valid email address')
const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password must not exceed 128 characters')

const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .trim()

// ID validator for path/body parameters that arrive as URL-encoded
// integer strings (e.g. "4"). Matches one or more digits only.
// Was previously z.string().uuid() which rejected every valid integer
// ID from the Prisma autoincrement Int primary keys.
const uuidSchema = z.string().regex(/^\d+$/, 'Invalid ID format')

export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
    role: z.literal('student', {
      errorMap: () => ({ message: 'Role must be student' })
    })
  })
})

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required')
  })
})

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema
  })
})

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema
  })
})

export const updateUserSchema = z.object({
  params: z.object({
    id: uuidSchema
  }),
  body: z
    .object({
      name: nameSchema.optional(),
      email: emailSchema.optional(),
      status: z.enum(['active', 'inactive', 'pending']).optional(),
      currentPassword: z.string().optional(),
      newPassword: passwordSchema.optional()
    })
    .refine(
      (data) => {
        if (data.newPassword) {
          return !!data.currentPassword && data.currentPassword.length > 0
        }
        return true
      },
      {
        message: 'Current password is required to change password',
        path: ['currentPassword']
      }
    )
})

export const createTeacherSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema
  })
})

export const createClassSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Class name must be at least 2 characters')
      .max(120, 'Class name must not exceed 120 characters')
      .trim(),
    subject: z
      .string()
      .min(2, 'Subject must be at least 2 characters')
      .max(120, 'Subject must not exceed 120 characters')
      .trim(),
    description: z
      .string()
      .max(1000, 'Description must not exceed 1000 characters')
      .trim()
      .optional()
  })
})

export const updateClassSchema = z.object({
  params: z.object({
    id: uuidSchema
  }),
  body: z.object({
    name: z.string().min(2).max(120).trim().optional(),
    subject: z.string().min(2).max(120).trim().optional(),
    description: z.string().max(1000).trim().optional()
  })
})

export const classEnrollmentSchema = z.object({
  params: z.object({
    classId: uuidSchema,
    userId: uuidSchema
  })
})

export const createAnnouncementSchema = z.object({
  params: z.object({
    classId: uuidSchema
  }),
  body: z.object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title must not exceed 200 characters')
      .trim(),
    content: z
      .string()
      .min(5, 'Content must be at least 5 characters')
      .max(5000, 'Content must not exceed 5000 characters')
      .trim()
  })
})

export const updateAnnouncementSchema = z.object({
  params: z.object({
    id: uuidSchema
  }),
  body: z.object({
    title: z.string().min(3).max(200).trim().optional(),
    content: z.string().min(5).max(5000).trim().optional()
  })
})

export const createCommentSchema = z.object({
  params: z.object({
    announcementId: uuidSchema
  }),
  body: z.object({
    content: z
      .string()
      .min(1, 'Comment cannot be empty')
      .max(2000, 'Comment must not exceed 2000 characters')
      .trim()
  })
})

const quizQuestionSchema = z.object({
  questionText: z
    .string()
    .min(3, 'Question text must be at least 3 characters')
    .max(1000)
    .trim(),
  questionType: z.literal('multiple_choice'),
  options: z
    .array(z.string().trim())
    .min(2, 'At least 2 options are required')
    .max(6, 'At most 6 options allowed'),
  correctAnswer: z
    .string()
    .min(1, 'Correct answer is required')
    .trim(),
  points: z
    .number()
    .int()
    .min(1, 'Points must be at least 1')
    .max(100)
    .default(1)
})

export const createQuizSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, 'Quiz title must be at least 3 characters')
      .max(200, 'Quiz title must not exceed 200 characters')
      .trim(),
    description: z
      .string()
      .max(2000, 'Description must not exceed 2000 characters')
      .trim()
      .optional()
      .or(z.literal(''))
      .nullable(),
    classId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)], {
      errorMap: () => ({ message: 'Class ID must be a valid ID' })
    }),
    timeLimit: z
      .number()
      .int()
      .min(1)
      .max(300, 'Time limit must be between 1 and 300 minutes')
      .nullable()
      .optional(),
    questions: z
      .array(quizQuestionSchema)
      .min(1, 'At least one question is required')
      .max(100, 'Maximum 100 questions allowed')
  })
})

export const submitQuizSchema = z.object({
  params: z.object({
    quizId: uuidSchema
  }),
  body: z.object({
    answers: z.array(
      z.object({
        questionId: z.number().int().positive('Question ID is required'),
        studentAnswer: z.string().min(0).default('')
      }).passthrough()
    ).min(1, 'At least one answer is required'),
    timeTaken: z.number().int().min(0).optional()
  })
})

export const fileUploadParamsSchema = z.object({
  params: z.object({
    classId: uuidSchema
  })
})
