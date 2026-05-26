# tutorspace-lms
Personal tutoring LMS 

```
tutorspace-lms
├─ backend
│  ├─ check-admin.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ prisma
│  │  ├─ schema.prisma
│  │  └─ seed.js
│  └─ src
│     ├─ app.js
│     ├─ config
│     │  └─ multer.config.js
│     ├─ controllers
│     │  ├─ announcement.controller.js
│     │  ├─ auth.controller.js
│     │  ├─ class.controller.js
│     │  ├─ file.controller.js
│     │  ├─ quiz.controller.js
│     │  └─ user.controller.js
│     ├─ index.js
│     ├─ middleware
│     │  ├─ auth.middleware.js
│     │  └─ validate.middleware.js
│     ├─ schemas
│     │  └─ validation.schema.js
│     └─ utils
│        ├─ email.utils.js
│        └─ jwt.utils.js
├─ docs
│  ├─ api-endpoints.md
│  ├─ component-guide.md
│  └─ database-schema.md
├─ index.html
├─ LICENSE
├─ package-lock.json
├─ package.json
├─ public
├─ README.md
├─ src
│  ├─ App.css
│  ├─ App.jsx
│  ├─ assets
│  │  ├─ fonts
│  │  ├─ icons
│  │  └─ images
│  ├─ components
│  │  ├─ announcements
│  │  ├─ auth
│  │  ├─ classes
│  │  ├─ dashboard
│  │  │  ├─ ActivityFeed.jsx
│  │  │  ├─ ActivityFeed.module.css
│  │  │  ├─ StatCard.jsx
│  │  │  └─ StatCard.module.css
│  │  ├─ materials
│  │  ├─ quizzes
│  │  ├─ shared
│  │  │  ├─ Button
│  │  │  │  ├─ Button.jsx
│  │  │  │  ├─ Button.module.css
│  │  │  │  └─ index.js
│  │  │  ├─ Input
│  │  │  │  ├─ index.js
│  │  │  │  ├─ Input.jsx
│  │  │  │  ├─ Input.module.css
│  │  │  │  └─ Textarea.jsx
│  │  │  ├─ PasswordStrength
│  │  │  │  ├─ PasswordStrength.jsx
│  │  │  │  └─ PasswordStrength.module.css
│  │  │  ├─ Skeleton
│  │  │  │  ├─ index.js
│  │  │  │  ├─ Skeleton.jsx
│  │  │  │  └─ Skeleton.module.css
│  │  │  ├─ Toast
│  │  │  │  ├─ Toast.jsx
│  │  │  │  ├─ Toast.module.css
│  │  │  │  ├─ ToastContainer.jsx
│  │  │  │  └─ ToastContainer.module.css
│  │  │  └─ TopLoadingBar
│  │  │     ├─ index.js
│  │  │     ├─ TopLoadingBar.jsx
│  │  │     └─ TopLoadingBar.module.css
│  │  └─ users
│  ├─ context
│  │  ├─ AuthContext.jsx
│  │  └─ ToastContext.jsx
│  ├─ hooks
│  ├─ index.css
│  ├─ index.js
│  ├─ main.jsx
│  ├─ pages
│  │  ├─ admin
│  │  │  ├─ Classes
│  │  │  │  ├─ AdminClassDetail.jsx
│  │  │  │  ├─ AdminClassDetail.module.css
│  │  │  │  ├─ AdminClasses.jsx
│  │  │  │  ├─ AdminClasses.module.css
│  │  │  │  ├─ index.js
│  │  │  │  └─ NewClass
│  │  │  │     ├─ index.js
│  │  │  │     ├─ NewClass.jsx
│  │  │  │     └─ NewClass.module.css
│  │  │  ├─ Dashboard
│  │  │  │  ├─ AdminDashboard.jsx
│  │  │  │  ├─ AdminDashboard.module.css
│  │  │  │  └─ index.js
│  │  │  └─ Users
│  │  │     ├─ AdminUsers.jsx
│  │  │     ├─ AdminUsers.module.css
│  │  │     └─ index.js
│  │  ├─ Login
│  │  │  ├─ index.js
│  │  │  ├─ Login.jsx
│  │  │  └─ Login.module.css
│  │  ├─ Register
│  │  │  ├─ index.js
│  │  │  ├─ Register.jsx
│  │  │  └─ Register.module.css
│  │  ├─ Settings
│  │  │  ├─ index.js
│  │  │  ├─ Settings.jsx
│  │  │  └─ Settings.module.css
│  │  ├─ student
│  │  │  ├─ Announcements
│  │  │  │  ├─ Detail
│  │  │  │  │  ├─ AnnouncementDetail.jsx
│  │  │  │  │  ├─ AnnouncementDetail.module.css
│  │  │  │  │  └─ index.js
│  │  │  │  ├─ index.js
│  │  │  │  ├─ StudentAnnouncements.jsx
│  │  │  │  └─ StudentAnnouncements.module.css
│  │  │  ├─ Classes
│  │  │  │  ├─ index.js
│  │  │  │  ├─ StudentClasses.jsx
│  │  │  │  └─ StudentClasses.module.css
│  │  │  ├─ Dashboard
│  │  │  │  ├─ index.js
│  │  │  │  ├─ StudentDashboard.jsx
│  │  │  │  └─ StudentDashboard.module.css
│  │  │  ├─ Files
│  │  │  │  ├─ index.js
│  │  │  │  ├─ StudentFiles.jsx
│  │  │  │  └─ StudentFiles.module.css
│  │  │  ├─ Quiz
│  │  │  │  ├─ index.js
│  │  │  │  ├─ StudentQuiz.jsx
│  │  │  │  ├─ StudentQuiz.module.css
│  │  │  │  ├─ TakeQuiz.jsx
│  │  │  │  └─ TakeQuiz.module.css
│  │  │  └─ Results
│  │  │     ├─ index.js
│  │  │     ├─ StudentResults.jsx
│  │  │     └─ StudentResults.module.css
│  │  └─ teacher
│  │     ├─ Analytics
│  │     │  ├─ index.js
│  │     │  ├─ TeacherAnalytics.jsx
│  │     │  └─ TeacherAnalytics.module.css
│  │     ├─ Announcements
│  │     │  └─ New
│  │     │     ├─ index.js
│  │     │     ├─ NewAnnouncement.jsx
│  │     │     └─ NewAnnouncement.module.css
│  │     ├─ Classes
│  │     │  ├─ index.js
│  │     │  ├─ TeacherClassDetail.jsx
│  │     │  ├─ TeacherClassDetail.module.css
│  │     │  ├─ TeacherClasses.jsx
│  │     │  └─ TeacherClasses.module.css
│  │     ├─ Dashboard
│  │     │  ├─ index.js
│  │     │  ├─ TeacherDashboard.jsx
│  │     │  └─ TeacherDashboard.module.css
│  │     ├─ Files
│  │     │  ├─ index.js
│  │     │  ├─ TeacherFiles.jsx
│  │     │  └─ TeacherFiles.module.css
│  │     └─ Quiz
│  │        ├─ index.js
│  │        ├─ TeacherQuiz.jsx
│  │        └─ TeacherQuiz.module.css
│  ├─ services
│  │  └─ api.js
│  ├─ styles
│  │  ├─ components.css
│  │  ├─ globals.css
│  │  └─ tokens.css
│  └─ utils
│     └─ validation.js
├─ tests
└─ vite.config.js

```