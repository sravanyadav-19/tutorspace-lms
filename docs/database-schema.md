# Database Schema

## Overview
PostgreSQL database with 12 tables supporting user management, class system, announcements, file sharing, and quiz functionality.

## Tables

### Users
- id (SERIAL PRIMARY KEY)
- email (VARCHAR UNIQUE)
- password_hash (VARCHAR)
- name (VARCHAR)
- role_id (INTEGER → roles.id)
- status (VARCHAR: active, pending, inactive)
- created_at (TIMESTAMP)

### Roles
- id (SERIAL PRIMARY KEY) 
- name (VARCHAR: admin, teacher, student)
- permissions (TEXT[])

### Classes
- id (SERIAL PRIMARY KEY)
- name (VARCHAR)
- subject (VARCHAR)
- description (TEXT)
- created_by (INTEGER → users.id)
- approved_by (INTEGER → users.id)
- status (VARCHAR: pending, active, inactive)

### Class_Enrollments
- user_id (INTEGER → users.id)
- class_id (INTEGER → classes.id)
- enrolled_at (TIMESTAMP)

### Announcements
- id (SERIAL PRIMARY KEY)
- title (VARCHAR)
- content (TEXT)
- author_id (INTEGER → users.id)
- class_id (INTEGER → classes.id)
- created_at (TIMESTAMP)

### Files
- id (SERIAL PRIMARY KEY)
- filename (VARCHAR)
- file_path (VARCHAR)
- description (TEXT)
- uploader_id (INTEGER → users.id)
- class_id (INTEGER → classes.id)
- category_id (INTEGER → file_categories.id)
- uploaded_at (TIMESTAMP)

## Relationships
- Users ←→ Roles (many-to-one)
- Users ←→ Classes (many-to-many via class_enrollments)
- Classes → Announcements
- Classes → Files
- Classes → Quizzes
