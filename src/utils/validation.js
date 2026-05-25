export const isValidEmail = (email) => {
  return /^\S+@\S+\.\S+$/.test(email)
}

export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const levels = [
    { label: 'Too weak', color: '#d32f2f' },
    { label: 'Weak', color: '#ed6c02' },
    { label: 'Fair', color: '#fbc02d' },
    { label: 'Good', color: '#689f38' },
    { label: 'Strong', color: '#2e7d32' }
  ]
  return { score, ...levels[score] }
}

export const validators = {
  name: (value) => {
    if (!value || !value.trim()) return 'Name is required'
    if (value.trim().length < 2) return 'Name must be at least 2 characters'
    if (value.trim().length > 100) return 'Name must not exceed 100 characters'
    return ''
  },
  email: (value) => {
    if (!value || !value.trim()) return 'Email is required'
    if (!isValidEmail(value)) return 'Please enter a valid email'
    return ''
  },
  password: (value) => {
    if (!value) return 'Password is required'
    if (value.length < 6) return 'Password must be at least 6 characters'
    return ''
  },
  confirmPassword: (value, formValues) => {
    if (!value) return 'Please confirm your password'
    if (value !== formValues?.password) return 'Passwords do not match'
    return ''
  },
  className: (value) => {
    if (!value || !value.trim()) return 'Class name is required'
    if (value.trim().length < 2) return 'Name must be at least 2 characters'
    if (value.trim().length > 120) return 'Name must not exceed 120 characters'
    return ''
  },
  subject: (value) => {
    if (!value || !value.trim()) return 'Subject is required'
    if (value.trim().length < 2) return 'Subject must be at least 2 characters'
    if (value.trim().length > 120) return 'Subject must not exceed 120 characters'
    return ''
  },
  announcementTitle: (value) => {
    if (!value || !value.trim()) return 'Title is required'
    if (value.trim().length < 3) return 'Title must be at least 3 characters'
    if (value.trim().length > 200) return 'Title must not exceed 200 characters'
    return ''
  },
  announcementContent: (value) => {
    if (!value || !value.trim()) return 'Content is required'
    if (value.trim().length < 5) return 'Content must be at least 5 characters'
    if (value.trim().length > 5000) return 'Content must not exceed 5000 characters'
    return ''
  },
  quizTitle: (value) => {
    if (!value || !value.trim()) return 'Quiz title is required'
    if (value.trim().length < 3) return 'Title must be at least 3 characters'
    if (value.trim().length > 200) return 'Title must not exceed 200 characters'
    return ''
  },
  questionText: (value) => {
    if (!value || !value.trim()) return 'Question text is required'
    if (value.trim().length < 3) return 'Question must be at least 3 characters'
    return ''
  },
  correctAnswer: (value) => {
    if (!value || !value.trim()) return 'Correct answer is required'
    return ''
  },
  currentPassword: (value, formValues) => {
    if (formValues?.newPassword && (!value || !value.trim())) {
      return 'Current password is required to change password'
    }
    return ''
  },
  newPassword: (value) => {
    if (!value) return ''
    if (value.length < 6) return 'New password must be at least 6 characters'
    return ''
  }
}

export const validateField = (name, value, formValues = {}) => {
  const validator = validators[name]
  if (!validator) return ''
  return validator(value, formValues, name)
}

export const validateForm = (fields, formValues) => {
  const errors = {}
  let isValid = true
  fields.forEach((field) => {
    const error = validateField(field, formValues[field], formValues)
    if (error) {
      errors[field] = error
      isValid = false
    }
  })
  return { errors, isValid }
}
