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
    // Zod v3 uses `.errors`; Zod v4 uses `.issues`
    const issues = error?.issues || error?.errors
    if (error instanceof ZodError || Array.isArray(issues)) {
      const formatted = (issues || []).map((e) => ({
        path: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
        message: e.message || 'Invalid value'
      }))
      return res.status(400).json({
        success: false,
        message: formatted[0]?.message || 'Validation failed',
        errors: formatted
      })
    }
    // Handle non-Zod errors (e.g., schema parse receiving malformed data)
    console.error('Validation middleware error:', error)
    return res.status(500).json({
      success: false,
      message: 'Validation error'
    })
  }
}
