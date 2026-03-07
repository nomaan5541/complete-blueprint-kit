

# Multi-School Management System — Phase 1: Foundation & Super Admin

## Overview
A SaaS platform where a Super Admin manages multiple schools, each with isolated data. This first phase covers authentication, the Super Admin dashboard, school management, and subscription management.

**Backend: Supabase (Lovable Cloud)** for auth, database, and row-level security.

---

## 1. Authentication System
- Login page with email/password
- Role-based routing: Super Admin → Super Admin Dashboard, School Admin → School Dashboard (placeholder for Phase 2)
- User roles table (super_admin, school_admin, teacher, student)

## 2. Super Admin Dashboard
- Stats widgets: Total Schools, Active Schools, Expired Schools, Total Students, Total Teachers, Total Revenue
- Clean card-based layout with summary metrics
- Sidebar navigation: Dashboard, Schools, Subscriptions, Payment History, Reports, Settings

## 3. School Management (CRUD)
- **School List** page with table: School Name, Admin Name, Students count, Plan, Status (Active/Inactive/Expired), with search & filters
- **Add School** form with:
  - School details: Name, Logo, Address, City, State, Pincode, Phone, Email, Registration Number
  - Admin details: Name, Email, Phone, Username, Password (auto-creates School Admin auth account)
  - Auto-generates School ID and Admin ID
- **School Detail** page showing school info, admin info, student/teacher counts, subscription status
- **Edit School** and **Activate/Deactivate/Delete** school actions

## 4. Subscription Management
- **Subscription Plans**: Starter, Professional, Enterprise with configurable pricing
- **Assign Plan** to a school with start date, expiry date, payment amount, payment status
- **Renewal** flow: extend expiry by selected duration
- **Renewal reminders** indicator for expiring subscriptions
- Auto-suspend schools with expired subscriptions (visual indicator)

## 5. Payment History
- List of all subscription payments across schools
- Filters by school, date range, status
- Basic invoice view with school and payment details

## 6. Database Schema (Supabase)
- `schools` table (school info, status, created_at)
- `user_roles` table (role-based access control)
- `profiles` table (name, phone, school_id linkage)
- `subscription_plans` table (plan definitions)
- `subscriptions` table (school_id, plan, start/expiry dates, payment info)
- `payment_history` table
- Row-Level Security: Super Admin sees all, School Admin sees only their school's data

## 7. Design & UX
- Clean, professional admin dashboard design
- Sidebar navigation with icons
- Responsive layout (desktop-first)
- Color scheme: Professional blue/slate tones
- Toast notifications for all actions

---

**Future phases will cover:** School Admin Setup Wizard, Academic Year System, Student/Teacher Management, Fee Management, Attendance, Exams, Timetable, Student Portal, Reports, and Notifications.

