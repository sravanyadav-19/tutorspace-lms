# TutorSpace LMS

A warm, approachable learning platform connecting teachers and students.

**Live at:** [tutorspace-lms.vercel.app](https://tutorspace-lms.vercel.app)

---

## What is TutorSpace?

TutorSpace is a full-featured Learning Management System designed for personal tutors, small schools, and independent educators. It combines class management, file sharing, quizzes, announcements, and analytics into one clean interface — without the complexity of enterprise LMS platforms.

Built in 50 days as a [#BuildInPublic](https://www.linkedin.com/search/results/all/?keywords=%23buildinpublic) project.

---

## Who is it for?

### 👑 Admin

The central hub for managing your learning ecosystem.

- View platform-wide statistics — total users, active users, classes, pending approvals
- Manage users with status-based workflows: approve, deactivate, or delete accounts
- Create and manage classes — set name, subject, description
- Assign teachers and students to classes with a single click
- Create teacher accounts directly (teachers can't self-register)
- Full visibility into every class: enrollments, announcements, quizzes, files

### 🎯 Teacher

Everything you need to run your classes, in one place.

- Dashboard with at-a-glance stats: classes taught, total students, announcements posted, quizzes created
- View all assigned classes with student counts and activity summaries
- Post announcements to keep students updated — they see them instantly
- Upload files (PDF, PNG) with drag-and-drop — students view them in a protected, watermarked viewer
- Create quizzes with multiple-choice questions, points, and time limits
- Publish quizzes to students and release results when ready
- Analytics dashboard: average score, highest/lowest, pass rates, per-student submissions
- One-click release grades to all students

### 🎓 Student

Your learning journey, organized and accessible.

- Dashboard showing enrolled classes, pending quizzes, and recent announcements
- View announcements from all your teachers with threaded comments
- Access class files in a secure viewer — with your name and date watermarked
- Take quizzes with live timers, auto-submit when time runs out
- See instant auto-graded results when your teacher releases them
- Review every answer — correct and incorrect — with point breakdowns
- Track your results across all quizzes in one place

---

## Features at a Glance

| Category | Capabilities |
|----------|-------------|
| **Auth & Security** | JWT authentication, role-based access (admin/teacher/student), bcrypt passwords, rate limiting |
| **User Management** | Approve/deactivate/delete users, create teacher accounts, role-specific dashboards |
| **Class Management** | Create classes, assign teachers & students, view enrollments and activity |
| **Announcements** | Teacher posting, student viewing, threaded comments, delete management |
| **File Sharing** | PDF/PNG upload with drag-and-drop, protected student viewer with watermarks, right-click blocking |
| **Quiz System** | Multiple choice + open-ended, points per question, time limits, auto-submit, auto-grading |
| **Results & Analytics** | Color-coded score circles, answer reviews, teacher analytics dashboard, pass rates |
| **User Experience** | Skeleton loaders, toast notifications, confirm modals, card hover effects, page transitions |
| **Accessibility** | Skip-to-content, ARIA labels, keyboard navigation, focus rings, reduced motion support |
| **Responsive Design** | Full mobile + tablet + desktop support (480px / 768px / 1024px breakpoints) |
| **Error Handling** | Error boundary crash recovery, contextual validation errors, empty state placeholders |

---

## Design System

TutorSpace uses a warm, approachable design language:

- **Canvas:** Cream (#faf9f5) — soft, reading-friendly background
- **Primary:** Coral (#cc785c) — warm, inviting accent color
- **Typography:** JetBrains Mono (headlines) + Inter (body) — clean, modern, highly readable
- **Icons:** Lucide React — consistent, accessible, cross-platform

---

## Tech Stack

React · Vite · Node.js · Express · PostgreSQL · Prisma ORM · JWT · Zod · Multer · Helmet · Lucide React

---

## Status

**50-Day Project** — Day 24/50 complete.

Deployed and live. Feature development continues daily.

---

## Links

- **Live App:** [tutorspace-lms.vercel.app](https://tutorspace-lms.vercel.app)
- **GitHub:** [github.com/sravanyadav-19/tutorspace-lms](https://github.com/sravanyadav-19/tutorspace-lms)
- **Build Log:** [#BuildInPublic on LinkedIn](https://www.linkedin.com/search/results/all/?keywords=%23buildinpublic)