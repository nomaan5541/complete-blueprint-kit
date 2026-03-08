# EduManage — Complete Database Report

> **Generated:** 2026-03-08  
> **Platform:** Multi-School Management SaaS  
> **Backend:** Lovable Cloud (Supabase)  
> **Tables:** 28 | **Enums:** 3 | **Functions:** 6

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Enum Types](#2-enum-types)
3. [Database Functions](#3-database-functions)
4. [Table Catalog](#4-table-catalog)
5. [Foreign Key Relationships](#5-foreign-key-relationships)
6. [Entity Relationship Diagram (Text)](#6-entity-relationship-diagram)
7. [RLS Policy Summary](#7-rls-policy-summary)
8. [Data Flow by Feature](#8-data-flow-by-feature)
9. [Storage Buckets](#9-storage-buckets)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        auth.users                               │
│                   (Supabase Auth - managed)                      │
└──────┬──────────────┬──────────────┬───────────────┬────────────┘
       │              │              │               │
       ▼              ▼              ▼               ▼
  ┌─────────┐   ┌──────────┐  ┌──────────┐   ┌────────────┐
  │ profiles │   │user_roles│  │ teachers │   │  students   │
  │(all users│   │(role map)│  │(teacher  │   │(student    │
  │ metadata)│   │          │  │ records) │   │ records)   │
  └────┬─────┘   └──────────┘  └────┬─────┘   └─────┬──────┘
       │                            │                │
       └────────────┬───────────────┘                │
                    ▼                                │
              ┌──────────┐                           │
              │  schools  │◄──────────────────────────┘
              │ (central  │
              │  tenant)  │
              └─────┬─────┘
                    │
    ┌───────┬───────┼───────┬──────────┬──────────┐
    ▼       ▼       ▼       ▼          ▼          ▼
 classes subjects academic  exams   fee_types  teachers
              years                             
```

### Multi-Tenancy Model
- **`schools`** is the central tenant table — nearly every other table has a `school_id` FK
- **RLS policies** enforce tenant isolation using `school_id` checks
- **`auth.users`** is managed by Supabase Auth; we never modify it directly

### Data Hierarchy
```
School → Academic Year → Class → Section → Student
                              → Subject
                              → Exam → Marks
                              → Attendance
                              → Fee Structure → Fee Payment
```

---

## 2. Enum Types

### `app_role`
| Value | Description |
|-------|-------------|
| `super_admin` | Platform-wide administrator |
| `school_admin` | School-level administrator |
| `teacher` | Teacher role |
| `student` | Student role |

### `school_status`
| Value | Description |
|-------|-------------|
| `active` | School is active and fully functional |
| `inactive` | School is deactivated |
| `expired` | Subscription expired |
| `suspended` | Manually suspended by super admin |

### `payment_status`
| Value | Description |
|-------|-------------|
| `paid` | Payment completed |
| `pending` | Payment pending |
| `failed` | Payment failed |
| `refunded` | Payment refunded |

---

## 3. Database Functions

| Function | Security | Purpose |
|----------|----------|---------|
| `has_role(uuid, app_role)` | DEFINER | Check if user has a specific role (used in RLS) |
| `get_teacher_school_id(uuid)` | DEFINER | Get teacher's school_id without RLS recursion |
| `handle_new_user()` | DEFINER | Trigger: auto-create profile on user signup |
| `seed_school_defaults()` | DEFINER | Trigger: seed default classes, subjects, roles on school creation |
| `generate_receipt_number(uuid)` | DEFINER | Atomic receipt number generation with prefix + counter |
| `update_updated_at_column()` | INVOKER | Trigger: auto-update `updated_at` timestamp |

---

## 4. Table Catalog

### 4.1 `schools` — Central tenant table
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| name | text | NO | — | School name |
| admin_id | uuid | YES | — | FK → auth.users |
| status | school_status | NO | 'active' | Enum |
| address | text | YES | — | |
| city | text | YES | — | |
| state | text | YES | — | |
| pincode | text | YES | — | |
| phone | text | YES | — | |
| email | text | YES | — | |
| website | text | YES | — | |
| logo_url | text | YES | — | |
| principal_name | text | YES | — | |
| registration_number | text | YES | — | |
| receipt_prefix | text | NO | 'RCPT' | For fee receipts |
| receipt_counter | integer | NO | 0 | Auto-increment counter |
| setup_completed | boolean | NO | false | Setup wizard flag |
| school_start_time | time | YES | — | |
| school_end_time | time | YES | — | |
| msg91_auth_key | text | YES | — | SMS integration |
| msg91_sender_id | text | YES | — | SMS integration |
| msg91_whatsapp_template_id | text | YES | — | WhatsApp integration |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

### 4.2 `profiles` — User profiles (all roles)
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | — | FK → auth.users |
| full_name | text | NO | '' |
| phone | text | YES | — |
| avatar_url | text | YES | — |
| school_id | uuid | YES | — | FK → schools |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### 4.3 `user_roles` — Role assignments
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | — | FK → auth.users |
| role | app_role | NO | — | Enum |

### 4.4 `academic_years`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| name | text | NO | — | e.g. "2025-2026" |
| start_date | date | NO | — |
| end_date | date | NO | — |
| status | text | NO | 'not_started' |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### 4.5 `classes`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| name | text | NO | — | e.g. "Nursery", "1", "10" |
| display_order | integer | NO | 0 |
| created_at | timestamptz | NO | now() |

### 4.6 `sections`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| class_id | uuid | NO | — | FK → classes |
| name | text | NO | — | e.g. "A", "B" |
| created_at | timestamptz | NO | now() |

### 4.7 `subjects`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| name | text | NO | — |
| code | text | YES | — | e.g. "MAT", "ENG" |
| created_at | timestamptz | NO | now() |

### 4.8 `class_subjects` — Many-to-many mapping
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| class_id | uuid | NO | — | FK → classes |
| subject_id | uuid | NO | — | FK → subjects |
| created_at | timestamptz | NO | now() |

### 4.9 `student_master` — Permanent student identity
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| name | text | NO | — |
| admission_number | text | NO | — |
| status | text | NO | 'active' |
| user_id | uuid | YES | — |
| date_of_birth | date | YES | — |
| gender | text | YES | — |
| father_name | text | YES | — |
| mother_name | text | YES | — |
| father_phone | text | YES | — |
| guardian_name | text | YES | — |
| guardian_phone | text | YES | — |
| guardian_relation | text | YES | — |
| address, city, state, pincode | text | YES | — |
| photo_url | text | YES | — |
| phone | text | YES | — |
| blood_group | text | YES | — |
| roll_number | text | YES | — |
| pen_number | text | YES | — |
| bio | text | YES | — |
| admission_date | date | YES | CURRENT_DATE |
| joining_date | date | YES | — |
| caste_category | text | YES | — |
| scholarship_category | text | YES | — |
| previous_school | text | YES | — |
| previous_class_passed | text | YES | — |
| tc_number | text | YES | — |
| medium_of_instruction | text | YES | — |
| second_language | text | YES | — |
| elective_subjects | text | YES | — |
| father_occupation | text | YES | — |
| mother_occupation | text | YES | — |
| alternate_contact | text | YES | — |
| parent_email | text | YES | — |
| family_annual_income | text | YES | — |
| created_at / updated_at | timestamptz | NO | now() |

### 4.10 `students` — Yearly academic records
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| academic_year_id | uuid | NO | — | FK → academic_years |
| student_master_id | uuid | YES | — | FK → student_master |
| class_id | uuid | YES | — | FK → classes |
| section_id | uuid | YES | — | FK → sections |
| user_id | uuid | YES | — | FK → auth.users |
| name | text | NO | — |
| admission_number | text | NO | — |
| status | text | NO | 'active' |
| *(same personal fields as student_master)* | | | |
| created_at / updated_at | timestamptz | NO | now() |

### 4.11 `teachers`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| user_id | uuid | YES | — | FK → auth.users |
| name | text | NO | — |
| email | text | YES | — |
| phone | text | YES | — |
| gender | text | YES | — |
| qualification | text | YES | — |
| joining_date | date | YES | — |
| status | text | NO | 'active' |
| created_at / updated_at | timestamptz | NO | now() |

### 4.12 `teacher_assignments`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| teacher_id | uuid | NO | — | FK → teachers |
| class_id | uuid | NO | — | FK → classes |
| section_id | uuid | YES | — | FK → sections |
| subject_id | uuid | NO | — | FK → subjects |
| academic_year_id | uuid | NO | — | FK → academic_years |
| created_at | timestamptz | NO | now() |

### 4.13 `exams`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| academic_year_id | uuid | NO | — | FK → academic_years |
| name | text | NO | — |
| exam_type | text | NO | 'exam' | FA1, FA2, MID, FINAL, etc. |
| exam_mode | text | NO | 'offline' | 'online' or 'offline' |
| class_id | uuid | YES | — | FK → classes |
| section_id | uuid | YES | — | FK → sections |
| subject_id | uuid | YES | — | FK → subjects |
| exam_date | date | YES | — |
| start_date | date | YES | — |
| end_date | date | YES | — |
| total_marks | numeric | YES | 100 |
| duration_minutes | integer | YES | — | For online exams |
| instructions | text | YES | — |
| status | text | NO | 'draft' | draft → published → completed |
| created_at | timestamptz | NO | now() |

### 4.14 `exam_questions` — Online MCQ questions
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| exam_id | uuid | NO | — | FK → exams |
| question_text | text | NO | — |
| question_type | text | NO | 'mcq' |
| image_url | text | YES | — |
| marks | numeric | NO | 1 |
| order_number | integer | NO | 0 |
| created_at | timestamptz | NO | now() |

### 4.15 `exam_options` — MCQ answer options
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| question_id | uuid | NO | — | FK → exam_questions |
| option_text | text | NO | — |
| option_image | text | YES | — |
| is_correct | boolean | NO | false |
| created_at | timestamptz | NO | now() |

### 4.16 `exam_marks` — Offline marks entry
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| exam_id | uuid | NO | — | FK → exams |
| student_id | uuid | NO | — | FK → students |
| subject_id | uuid | NO | — | FK → subjects |
| class_id | uuid | NO | — | FK → classes |
| marks_obtained | numeric | YES | — |
| max_marks | numeric | NO | 100 |
| grade | text | YES | — |
| remarks | text | YES | — |
| created_at | timestamptz | NO | now() |

### 4.17 `student_exam_attempts` — Online exam attempts
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| exam_id | uuid | NO | — | FK → exams |
| student_id | uuid | NO | — | FK → students |
| status | text | NO | 'not_started' |
| start_time | timestamptz | YES | — |
| end_time | timestamptz | YES | — |
| score | numeric | YES | — |
| created_at | timestamptz | NO | now() |

### 4.18 `student_answers` — Individual question answers
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| attempt_id | uuid | NO | — | FK → student_exam_attempts |
| question_id | uuid | NO | — | FK → exam_questions |
| selected_option_id | uuid | YES | — | FK → exam_options |
| is_correct | boolean | YES | — |
| marks_awarded | numeric | YES | 0 |
| created_at | timestamptz | NO | now() |

### 4.19 `grade_systems` — Custom grade scales per school
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| grade | text | NO | — | e.g. "A1", "B2" |
| min_marks | numeric | NO | — |
| max_marks | numeric | NO | — |
| created_at | timestamptz | NO | now() |

### 4.20 `attendance`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| student_id | uuid | NO | — | FK → students |
| class_id | uuid | NO | — | FK → classes |
| section_id | uuid | YES | — | FK → sections |
| academic_year_id | uuid | NO | — | FK → academic_years |
| date | date | NO | — |
| status | text | NO | — | 'present', 'absent', 'leave' |
| marked_by | uuid | YES | — | FK → auth.users |
| created_at | timestamptz | NO | now() |

### 4.21 `fee_types`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| name | text | NO | — | e.g. "Tuition", "Transport" |
| description | text | YES | — |
| created_at | timestamptz | NO | now() |

### 4.22 `fee_structures` — Fee amount per class per year
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| academic_year_id | uuid | NO | — | FK → academic_years |
| class_id | uuid | NO | — | FK → classes |
| fee_type_id | uuid | NO | — | FK → fee_types |
| amount | numeric | NO | 0 |
| created_at | timestamptz | NO | now() |

### 4.23 `fee_payments`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| student_id | uuid | NO | — | FK → students |
| fee_type_id | uuid | NO | — | FK → fee_types |
| academic_year_id | uuid | NO | — | FK → academic_years |
| amount | numeric | NO | — |
| payment_date | timestamptz | NO | now() |
| payment_mode | text | YES | — | CASH, UPI, etc. |
| receipt_number | text | YES | — |
| notes | text | YES | — |
| created_at | timestamptz | NO | now() |

### 4.24 `notifications`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| title | text | NO | — |
| message | text | NO | — |
| type | text | NO | 'general' |
| target_role | text | YES | — |
| target_class_id | uuid | YES | — | FK → classes |
| created_by | uuid | YES | — | FK → auth.users |
| created_at | timestamptz | NO | now() |

### 4.25 `school_events`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| title | text | NO | — |
| description | text | YES | — |
| event_type | text | NO | 'general' |
| start_date | date | NO | — |
| end_date | date | YES | — |
| created_by | uuid | YES | — |
| created_at | timestamptz | NO | now() |

### 4.26 `school_roles` — Custom roles per school
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| name | text | NO | — |
| description | text | YES | — |
| created_at | timestamptz | NO | now() |

### 4.27 `school_credentials` — Login credentials tracking
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| person_name | text | NO | — |
| email | text | NO | — |
| password_plain | text | NO | — |
| account_type | text | NO | — |
| created_at | timestamptz | NO | now() |

### 4.28 `student_documents`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| student_id | uuid | NO | — | FK → students |
| document_type | text | NO | — |
| file_name | text | NO | — |
| file_url | text | NO | — |
| uploaded_by | uuid | YES | — |
| created_at | timestamptz | NO | now() |

### 4.29 `audit_logs`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| user_id | uuid | YES | — |
| action | text | NO | — |
| entity_type | text | NO | — |
| entity_id | text | YES | — |
| details | jsonb | YES | — |
| created_at | timestamptz | NO | now() |

### 4.30 `timetable_slots`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| *(slot definition fields)* | | | |

### 4.31 `timetable_entries`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| academic_year_id | uuid | NO | — | FK → academic_years |
| class_id | uuid | NO | — | FK → classes |
| section_id | uuid | YES | — | FK → sections |
| slot_id | uuid | NO | — | FK → timetable_slots |
| subject_id | uuid | YES | — | FK → subjects |
| teacher_id | uuid | YES | — | FK → teachers |
| day_of_week | integer | NO | — | 0=Mon … 6=Sun |
| created_at | timestamptz | NO | now() |

### 4.32 `subscription_plans`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| name | text | NO | — |
| description | text | YES | — |
| price | numeric | NO | 0 |
| duration_months | integer | NO | 12 |
| max_students | integer | YES | — |
| max_teachers | integer | YES | — |
| features | jsonb | YES | '[]' |
| is_active | boolean | NO | true |
| created_at / updated_at | timestamptz | NO | now() |

### 4.33 `subscriptions`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| plan_id | uuid | NO | — | FK → subscription_plans |
| start_date | timestamptz | NO | now() |
| end_date | timestamptz | NO | — |
| is_active | boolean | NO | true |
| payment_amount | numeric | NO | 0 |
| payment_status | payment_status | NO | 'pending' |
| created_at / updated_at | timestamptz | NO | now() |

### 4.34 `subscription_requests`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_name | text | NO | — |
| contact_name | text | NO | — |
| email | text | NO | — |
| phone | text | YES | — |
| message | text | YES | — |
| plan_id | uuid | YES | — | FK → subscription_plans |
| status | text | NO | 'pending' |
| reviewed_by | uuid | YES | — |
| reviewed_at | timestamptz | YES | — |
| created_at | timestamptz | NO | now() |

### 4.35 `payment_history`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| school_id | uuid | NO | — | FK → schools |
| subscription_id | uuid | YES | — | FK → subscriptions |
| amount | numeric | NO | — |
| payment_date | timestamptz | NO | now() |
| payment_method | text | YES | — |
| transaction_id | text | YES | — |
| status | payment_status | NO | 'pending' |
| notes | text | YES | — |
| created_at | timestamptz | NO | now() |

---

## 5. Foreign Key Relationships

### Complete FK Map

| Table | Column | → References |
|-------|--------|-------------|
| **academic_years** | school_id | → schools.id |
| **attendance** | school_id | → schools.id |
| | student_id | → students.id |
| | class_id | → classes.id |
| | section_id | → sections.id |
| | academic_year_id | → academic_years.id |
| | marked_by | → auth.users.id |
| **audit_logs** | school_id | → schools.id |
| **class_subjects** | school_id | → schools.id |
| | class_id | → classes.id |
| | subject_id | → subjects.id |
| **classes** | school_id | → schools.id |
| **exam_marks** | school_id | → schools.id |
| | exam_id | → exams.id |
| | student_id | → students.id |
| | subject_id | → subjects.id |
| | class_id | → classes.id |
| **exam_options** | question_id | → exam_questions.id |
| **exam_questions** | exam_id | → exams.id |
| **exams** | school_id | → schools.id |
| | academic_year_id | → academic_years.id |
| | class_id | → classes.id |
| | section_id | → sections.id |
| | subject_id | → subjects.id |
| **fee_payments** | school_id | → schools.id |
| | student_id | → students.id |
| | fee_type_id | → fee_types.id |
| | academic_year_id | → academic_years.id |
| **fee_structures** | school_id | → schools.id |
| | class_id | → classes.id |
| | fee_type_id | → fee_types.id |
| | academic_year_id | → academic_years.id |
| **fee_types** | school_id | → schools.id |
| **grade_systems** | school_id | → schools.id |
| **notifications** | school_id | → schools.id |
| | target_class_id | → classes.id |
| | created_by | → auth.users.id |
| **payment_history** | school_id | → schools.id |
| | subscription_id | → subscriptions.id |
| **profiles** | user_id | → auth.users.id |
| | school_id | → schools.id |
| **school_credentials** | school_id | → schools.id |
| **school_events** | school_id | → schools.id |
| **school_roles** | school_id | → schools.id |
| **schools** | admin_id | → auth.users.id |
| **sections** | school_id | → schools.id |
| | class_id | → classes.id |
| **student_answers** | attempt_id | → student_exam_attempts.id |
| | question_id | → exam_questions.id |
| | selected_option_id | → exam_options.id |
| **student_documents** | school_id | → schools.id |
| | student_id | → students.id |
| **student_exam_attempts** | exam_id | → exams.id |
| | student_id | → students.id |
| **student_master** | school_id | → schools.id |
| **students** | school_id | → schools.id |
| | academic_year_id | → academic_years.id |
| | class_id | → classes.id |
| | section_id | → sections.id |
| | student_master_id | → student_master.id |
| | user_id | → auth.users.id |
| **subjects** | school_id | → schools.id |
| **subscription_requests** | plan_id | → subscription_plans.id |
| **subscriptions** | school_id | → schools.id |
| | plan_id | → subscription_plans.id |
| **teacher_assignments** | school_id | → schools.id |
| | teacher_id | → teachers.id |
| | class_id | → classes.id |
| | section_id | → sections.id |
| | subject_id | → subjects.id |
| | academic_year_id | → academic_years.id |
| **teachers** | school_id | → schools.id |
| | user_id | → auth.users.id |
| **timetable_entries** | school_id | → schools.id |
| | academic_year_id | → academic_years.id |
| | class_id | → classes.id |
| | section_id | → sections.id |
| | slot_id | → timetable_slots.id |
| | subject_id | → subjects.id |
| | teacher_id | → teachers.id |
| **timetable_slots** | school_id | → schools.id |
| **user_roles** | user_id | → auth.users.id |

---

## 6. Entity Relationship Diagram

```
                              ┌──────────────────┐
                              │    auth.users     │
                              │ (Supabase-managed)│
                              └─┬──┬──┬──┬──┬────┘
                                │  │  │  │  │
          ┌─────────────────────┘  │  │  │  └────────────────────┐
          ▼                        ▼  │  ▼                       ▼
    ┌──────────┐            ┌──────────┐│ ┌──────────┐    ┌────────────┐
    │ profiles │            │user_roles││ │ teachers │    │  students  │
    └────┬─────┘            └──────────┘│ └────┬─────┘    └──────┬─────┘
         │                              │      │                 │
         │                              ▼      │                 │
         │                      ┌────────────┐ │                 │
         └──────────────────────│   schools   │◄┘                │
                                └──────┬─────┘                   │
                                       │                         │
         ┌────────┬────────┬───────┬───┼────┬──────┬─────────────┘
         ▼        ▼        ▼       ▼   │    ▼      ▼
    ┌────────┐┌────────┐┌────────┐┌────┴───┐┌─────────┐┌──────────────┐
    │classes ││subjects││academic││fee_    ││grade_   ││student_master│
    │        ││        ││_years  ││types   ││systems  ││              │
    └──┬──┬──┘└───┬────┘└───┬────┘└───┬────┘└─────────┘└──────────────┘
       │  │       │         │         │
       │  ▼       │         │         │
       │┌────────┐│         │         │
       ││sections││         │         │
       │└────────┘│         │         │
       │          │         │         │
       ▼          ▼         ▼         ▼
  ┌──────────────────────────────────────────────┐
  │              ACADEMIC RECORDS                 │
  ├──────────┬──────────┬──────────┬─────────────┤
  │attendance│  exams   │fee_struc-│fee_payments  │
  │          │    │     │tures     │              │
  │          │    ▼     │          │              │
  │          │┌────────┐│          │              │
  │          ││exam_   ││          │              │
  │          ││marks   ││          │              │
  │          │└────────┘│          │              │
  │          │    │     │          │              │
  │          │    ▼     │          │              │
  │          │┌────────┐│          │              │
  │          ││exam_   ││          │              │
  │          ││questions│          │              │
  │          │└───┬────┘│          │              │
  │          │    ▼     │          │              │
  │          │┌────────┐│          │              │
  │          ││exam_   ││          │              │
  │          ││options ││          │              │
  │          │└────────┘│          │              │
  └──────────┴──────────┴──────────┴─────────────┘

  ┌──────────────────────────────────────────────┐
  │           PLATFORM MANAGEMENT                 │
  ├───────────────┬──────────────┬────────────────┤
  │subscription_  │subscriptions │payment_history │
  │plans          │              │                │
  │     ▲         │              │                │
  │     │         │              │                │
  │subscription_  │              │                │
  │requests       │              │                │
  └───────────────┴──────────────┴────────────────┘
```

---

## 7. RLS Policy Summary

### Access Pattern by Role

| Table | Super Admin | School Admin | Teacher | Student |
|-------|:-----------:|:------------:|:-------:|:-------:|
| schools | ALL | SELECT+UPDATE (own) | SELECT (own) | SELECT (own) |
| academic_years | ALL | ALL (own) | SELECT (own) | — |
| classes | ALL | ALL (own) | SELECT (own) | SELECT (own) |
| sections | ALL | ALL (own) | SELECT (own) | SELECT (own) |
| subjects | ALL | ALL (own) | SELECT (own) | SELECT (own) |
| class_subjects | ALL | ALL (own) | SELECT (own) | — |
| students | ALL | ALL (own) | SELECT (own school) | SELECT (own record) |
| student_master | ALL | ALL (own) | SELECT (own school) | SELECT (own record) |
| teachers | ALL | ALL (own) | SELECT (own record) | — |
| teacher_assignments | ALL | ALL (own) | SELECT (own) | — |
| exams | ALL | ALL (own) | SELECT (own school) | SELECT (own school) |
| exam_marks | ALL | ALL (own) | SELECT+INSERT+UPDATE | SELECT (own) |
| exam_questions | ALL | ALL (own) | SELECT (own school) | SELECT (own school) |
| exam_options | ALL | ALL (own) | SELECT (own school) | SELECT (own school) |
| student_exam_attempts | ALL | ALL (own) | SELECT (own school) | ALL (own) |
| student_answers | ALL | ALL (own) | SELECT (own school) | ALL (own) |
| attendance | ALL | ALL (own) | SELECT+INSERT+UPDATE | SELECT (own) |
| fee_types | ALL | ALL (own) | SELECT (own school) | — |
| fee_structures | ALL | ALL (own) | — | SELECT (own school) |
| fee_payments | ALL | ALL (own) | — | SELECT (own) |
| grade_systems | ALL | ALL (own) | — | SELECT (own school) |
| notifications | ALL | ALL (own) | SELECT (own school) | SELECT (own school) |
| school_events | ALL | ALL (own) | SELECT (own school) | SELECT (own school) |
| school_credentials | ALL | ALL (own) | — | — |
| school_roles | ALL | ALL (own) | — | — |
| student_documents | ALL | ALL (own) | — | — |
| audit_logs | ALL | SELECT+INSERT | INSERT | — |
| subscription_plans | ALL | SELECT (active) | — | — |
| subscriptions | ALL | — | — | — |
| payment_history | ALL | SELECT (own) | — | — |
| profiles | ALL | — | own record | own record |
| user_roles | ALL | — | — | — |

### RLS Enforcement Mechanism
- **Super Admin**: Uses `has_role(auth.uid(), 'super_admin')` — SECURITY DEFINER function
- **School Admin**: Uses `schools.admin_id = auth.uid()` join
- **Teacher**: Uses `teachers.user_id = auth.uid()` join (via `get_teacher_school_id()` for schools table to avoid recursion)
- **Student**: Uses `students.user_id = auth.uid()` or `profiles.user_id = auth.uid()` join

---

## 8. Data Flow by Feature

### 8.1 Student Admission
```
student_master (permanent record created)
     │
     ▼
students (yearly record created with academic_year_id, class_id)
     │
     ├── student_documents (uploaded files)
     └── profiles (if user account created)
```

### 8.2 Exam & Results Flow
```
exams (created with school_id, academic_year_id, class_id, subject_id)
  │
  ├── [OFFLINE MODE]
  │   └── exam_marks (teacher enters marks per student per subject)
  │
  └── [ONLINE MODE]
      ├── exam_questions (MCQ questions with images)
      │   └── exam_options (answer choices, one marked correct)
      │
      └── student_exam_attempts (student takes exam)
          └── student_answers (per-question responses, auto-graded)
```

### 8.3 Fee Management Flow
```
fee_types (define: Tuition, Transport, etc.)
     │
     ▼
fee_structures (set amount per class per year per fee_type)
     │
     ▼
fee_payments (record payment with receipt_number from generate_receipt_number())
```

### 8.4 Attendance Flow
```
Teacher/Admin marks attendance:
  attendance (student_id, class_id, date, status: present/absent/leave)
     │
     └── Linked to academic_year_id for historical isolation
```

### 8.5 Timetable Flow
```
timetable_slots (define period times per school)
     │
     ▼
timetable_entries (map: day + slot → class + subject + teacher)
```

### 8.6 Teacher Assignment Flow
```
teachers (school staff records)
     │
     ▼
teacher_assignments (teacher → class + subject + section per academic year)
     │
     ▼
timetable_entries (schedule assignments into specific time slots)
```

### 8.7 Subscription & Billing Flow
```
subscription_plans (platform-level pricing tiers)
     │
     ├── subscription_requests (school inquiry form)
     │
     ▼
subscriptions (active subscription per school)
     │
     ▼
payment_history (payment records per subscription)
```

### 8.8 Report Card Generation
```
Input: student_id + exam_id + class_id
     │
     ├── schools (school name, logo, address)
     ├── students (name, father_name, mother_name, DOB, photo_url, roll_number)
     ├── exam_marks (marks per subject)
     ├── grade_systems (grade scale lookup)
     └── attendance (attendance summary)
     │
     ▼
   Report Card PDF (rendered in browser, print-ready)
```

---

## 9. Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `school-logos` | ✅ Yes | School logo images |
| `student-documents` | ❌ No | Private student documents (TC, certificates) |
| `exam-images` | ✅ Yes | Question/option images for online exams |

### Storage Path Convention
```
{bucket}/{school_id}/{file_name}
```

---

## 10. Edge Functions

| Function | Purpose |
|----------|---------|
| `create-school-admin` | Create school admin user account |
| `create-user-account` | Create teacher/student user accounts |
| `send-absence-sms` | SMS notification for student absence |
| `send-notification` | General notification dispatch |

---

*End of Database Report*
