import { ZodError } from 'zod'

export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query
    })
    if (result.body) req.body = result.body
    if (result.params) req.params = result.params
    if (result.query) req.query = result.query
    next()
  } catch (error) {
    if (error instanceof ZodError) {
      const formatted = error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message
      }))
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatted
      })
    }
    return res.status(500).json({
      success: false,
      message: 'Internal validation error'
    })
  }
}
