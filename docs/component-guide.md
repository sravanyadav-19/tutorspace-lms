# Component Architecture

## Design System
- **Typography:** Monospace headlines (JetBrains Mono) + Sans body (Inter)
- **Colors:** Warm cream canvas + coral primary + dark navy
- **Layout:** Sidebar navigation + responsive card grids
- **Styling:** Global CSS + CSS Modules

## Component Structure
components/
├── auth/ # LoginForm, RegisterForm, ForgotPassword
├── classes/ # ClassCard, ClassForm, ClassGrid
├── announcements/ # AnnouncementCard, AnnouncementForm, Feed
├── materials/ # FileUpload, FileList, CategoryTabs
├── quizzes/ # QuizBuilder, QuizTaking, Results
├── users/ # UserCard, UserForm, UserManagement
├── dashboard/ # StatCard, ActivityFeed, QuickActions
├── layout/ # DashboardLayout, Sidebar, TopBar
└── shared/ # Button, Input, Modal, Card

text


## Development Priority
1. Shared components (Button, Input, Card)
2. Layout components (Sidebar, TopBar, DashboardLayout)
3. Auth components (Login, Register)
4. Feature components (Classes, Announcements, etc.)
