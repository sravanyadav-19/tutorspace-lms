import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// Send verification email
export const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`

  const mailOptions = {
    from: `"TutorSpace" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your TutorSpace Account',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #faf9f5;">
        <h1 style="font-family: monospace; color: #141413; font-size: 28px;">
          TutorSpace
        </h1>
        <h2 style="color: #141413; font-size: 22px;">
          Welcome, ${name}! 👋
        </h2>
        <p style="color: #3d3d3a; font-size: 15px; line-height: 1.6;">
          Thanks for signing up! Please verify your email address to get started.
        </p>
        <a href="${verifyUrl}" 
           style="display: inline-block; background: #cc785c; color: white; 
                  padding: 12px 24px; border-radius: 6px; text-decoration: none;
                  font-weight: bold; font-size: 14px; margin: 24px 0;">
          Verify Email Address
        </a>
        <p style="color: #6c6a64; font-size: 14px;">
          This link expires in 24 hours. If you didn't create an account, 
          please ignore this email.
        </p>
        <hr style="border: 1px solid #e6dfd8; margin: 24px 0;">
        <p style="color: #6c6a64; font-size: 13px;">
          © 2024 TutorSpace. Built with ❤️ for better learning.
        </p>
      </div>
    `
  }

  await transporter.sendMail(mailOptions)
}

// Send password reset email
export const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`

  const mailOptions = {
    from: `"TutorSpace" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your TutorSpace Password',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #faf9f5;">
        <h1 style="font-family: monospace; color: #141413; font-size: 28px;">
          TutorSpace
        </h1>
        <h2 style="color: #141413; font-size: 22px;">
          Password Reset Request
        </h2>
        <p style="color: #3d3d3a; font-size: 15px; line-height: 1.6;">
          Hi ${name}, we received a request to reset your password.
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; background: #cc785c; color: white;
                  padding: 12px 24px; border-radius: 6px; text-decoration: none;
                  font-weight: bold; font-size: 14px; margin: 24px 0;">
          Reset Password
        </a>
        <p style="color: #6c6a64; font-size: 14px;">
          This link expires in 1 hour. If you didn't request this, 
          please ignore this email.
        </p>
      </div>
    `
  }

  await transporter.sendMail(mailOptions)
}
