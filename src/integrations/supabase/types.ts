export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          school_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          school_id: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          school_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string
          date: string
          id: string
          marked_by: string | null
          school_id: string
          section_id: string | null
          status: string
          student_id: string
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string
          date: string
          id?: string
          marked_by?: string | null
          school_id: string
          section_id?: string | null
          status: string
          student_id: string
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          school_id?: string
          section_id?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          school_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          school_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          school_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      class_subjects: {
        Row: {
          class_id: string
          created_at: string
          id: string
          school_id: string
          subject_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          school_id: string
          subject_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          school_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          school_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_marks: {
        Row: {
          class_id: string
          created_at: string
          exam_id: string
          grade: string | null
          id: string
          marks_obtained: number | null
          max_marks: number
          remarks: string | null
          school_id: string
          student_id: string
          subject_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          exam_id: string
          grade?: string | null
          id?: string
          marks_obtained?: number | null
          max_marks?: number
          remarks?: string | null
          school_id: string
          student_id: string
          subject_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          exam_id?: string
          grade?: string | null
          id?: string
          marks_obtained?: number | null
          max_marks?: number
          remarks?: string | null
          school_id?: string
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_marks_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_marks_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_marks_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_marks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_options: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          option_image: string | null
          option_text: string
          question_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_image?: string | null
          option_text: string
          question_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_image?: string | null
          option_text?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          image_url: string | null
          marks: number
          order_number: number
          question_text: string
          question_type: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          image_url?: string | null
          marks?: number
          order_number?: number
          question_text: string
          question_type?: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          image_url?: string | null
          marks?: number
          order_number?: number
          question_text?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          academic_year_id: string
          class_id: string | null
          created_at: string
          duration_minutes: number | null
          end_date: string | null
          exam_date: string | null
          exam_mode: string
          exam_type: string
          id: string
          instructions: string | null
          name: string
          school_id: string
          section_id: string | null
          start_date: string | null
          status: string
          subject_id: string | null
          total_marks: number | null
        }
        Insert: {
          academic_year_id: string
          class_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          end_date?: string | null
          exam_date?: string | null
          exam_mode?: string
          exam_type?: string
          id?: string
          instructions?: string | null
          name: string
          school_id: string
          section_id?: string | null
          start_date?: string | null
          status?: string
          subject_id?: string | null
          total_marks?: number | null
        }
        Update: {
          academic_year_id?: string
          class_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          end_date?: string | null
          exam_date?: string | null
          exam_mode?: string
          exam_type?: string
          id?: string
          instructions?: string | null
          name?: string
          school_id?: string
          section_id?: string | null
          start_date?: string | null
          status?: string
          subject_id?: string | null
          total_marks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          academic_year_id: string
          amount: number
          created_at: string
          fee_type_id: string
          id: string
          notes: string | null
          payment_date: string
          payment_mode: string | null
          receipt_number: string | null
          school_id: string
          student_id: string
        }
        Insert: {
          academic_year_id: string
          amount: number
          created_at?: string
          fee_type_id: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_mode?: string | null
          receipt_number?: string | null
          school_id: string
          student_id: string
        }
        Update: {
          academic_year_id?: string
          amount?: number
          created_at?: string
          fee_type_id?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_mode?: string | null
          receipt_number?: string | null
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_fee_type_id_fkey"
            columns: ["fee_type_id"]
            isOneToOne: false
            referencedRelation: "fee_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year_id: string
          amount: number
          class_id: string
          created_at: string
          fee_type_id: string
          id: string
          school_id: string
        }
        Insert: {
          academic_year_id: string
          amount?: number
          class_id: string
          created_at?: string
          fee_type_id: string
          id?: string
          school_id: string
        }
        Update: {
          academic_year_id?: string
          amount?: number
          class_id?: string
          created_at?: string
          fee_type_id?: string
          id?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_fee_type_id_fkey"
            columns: ["fee_type_id"]
            isOneToOne: false
            referencedRelation: "fee_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          school_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_types_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      festival_themes: {
        Row: {
          animation_type: string
          colors: Json | null
          created_at: string
          description: string | null
          discount_percent: number | null
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          offer_text: string | null
          pricing_override: Json | null
          start_date: string | null
          theme_key: string
          updated_at: string
        }
        Insert: {
          animation_type?: string
          colors?: Json | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          offer_text?: string | null
          pricing_override?: Json | null
          start_date?: string | null
          theme_key: string
          updated_at?: string
        }
        Update: {
          animation_type?: string
          colors?: Json | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          offer_text?: string | null
          pricing_override?: Json | null
          start_date?: string | null
          theme_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      grade_systems: {
        Row: {
          created_at: string
          grade: string
          id: string
          max_marks: number
          min_marks: number
          school_id: string
        }
        Insert: {
          created_at?: string
          grade: string
          id?: string
          max_marks: number
          min_marks: number
          school_id: string
        }
        Update: {
          created_at?: string
          grade?: string
          id?: string
          max_marks?: number
          min_marks?: number
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_systems_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          academic_year_id: string
          attachment_url: string | null
          class_id: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          school_id: string
          section_id: string | null
          status: string
          subject_id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          attachment_url?: string | null
          class_id: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          school_id: string
          section_id?: string | null
          status?: string
          subject_id: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          attachment_url?: string | null
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          school_id?: string
          section_id?: string | null
          status?: string
          subject_id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          academic_year_id: string
          class_id: string | null
          created_at: string
          description: string | null
          id: string
          meet_link: string
          scheduled_end: string | null
          scheduled_start: string
          school_id: string
          section_id: string | null
          status: string
          subject_id: string | null
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          meet_link: string
          scheduled_end?: string | null
          scheduled_start: string
          school_id: string
          section_id?: string | null
          status?: string
          subject_id?: string | null
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          meet_link?: string
          scheduled_end?: string | null
          scheduled_start?: string
          school_id?: string
          section_id?: string | null
          status?: string
          subject_id?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
          school_id: string
          target_class_id: string | null
          target_role: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          school_id: string
          target_class_id?: string | null
          target_role?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          school_id?: string
          target_class_id?: string | null
          target_role?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_class_id_fkey"
            columns: ["target_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          school_id: string
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_payment_settings: {
        Row: {
          id: string
          payment_instructions: string | null
          qr_code_url: string | null
          updated_at: string
          updated_by: string | null
          upi_id: string | null
        }
        Insert: {
          id?: string
          payment_instructions?: string | null
          qr_code_url?: string | null
          updated_at?: string
          updated_by?: string | null
          upi_id?: string | null
        }
        Update: {
          id?: string
          payment_instructions?: string | null
          qr_code_url?: string | null
          updated_at?: string
          updated_by?: string | null
          upi_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          school_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          school_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          school_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_credentials: {
        Row: {
          account_type: string
          created_at: string
          email: string
          id: string
          person_name: string
          school_id: string
        }
        Insert: {
          account_type: string
          created_at?: string
          email: string
          id?: string
          person_name: string
          school_id: string
        }
        Update: {
          account_type?: string
          created_at?: string
          email?: string
          id?: string
          person_name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_credentials_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          school_id: string
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          school_id: string
          start_date: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          school_id?: string
          start_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_payment_config: {
        Row: {
          created_at: string
          payment_enabled: boolean
          school_id: string
          stripe_publishable_key: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          payment_enabled?: boolean
          school_id: string
          stripe_publishable_key?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          payment_enabled?: boolean
          school_id?: string
          stripe_publishable_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_payment_config_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          school_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_sms_config: {
        Row: {
          created_at: string
          msg91_auth_key: string | null
          msg91_sender_id: string | null
          msg91_whatsapp_template_id: string | null
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          msg91_auth_key?: string | null
          msg91_sender_id?: string | null
          msg91_whatsapp_template_id?: string | null
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          msg91_auth_key?: string | null
          msg91_sender_id?: string | null
          msg91_whatsapp_template_id?: string | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_sms_config_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          admin_id: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          id_card_signature_url: string | null
          id_card_template: string | null
          logo_url: string | null
          name: string
          phone: string | null
          pincode: string | null
          principal_name: string | null
          receipt_counter: number
          receipt_prefix: string
          registration_number: string | null
          school_end_time: string | null
          school_start_time: string | null
          setup_completed: boolean
          state: string | null
          status: Database["public"]["Enums"]["school_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          admin_id?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          id_card_signature_url?: string | null
          id_card_template?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          pincode?: string | null
          principal_name?: string | null
          receipt_counter?: number
          receipt_prefix?: string
          registration_number?: string | null
          school_end_time?: string | null
          school_start_time?: string | null
          setup_completed?: boolean
          state?: string | null
          status?: Database["public"]["Enums"]["school_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          admin_id?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          id_card_signature_url?: string | null
          id_card_template?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          pincode?: string | null
          principal_name?: string | null
          receipt_counter?: number
          receipt_prefix?: string
          registration_number?: string | null
          school_end_time?: string | null
          school_start_time?: string | null
          setup_completed?: boolean
          state?: string | null
          status?: Database["public"]["Enums"]["school_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      sections: {
        Row: {
          class_id: string
          created_at: string
          id: string
          name: string
          school_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          name: string
          school_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      student_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          marks_awarded: number | null
          question_id: string
          selected_option_id: string | null
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          question_id: string
          selected_option_id?: string | null
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          question_id?: string
          selected_option_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "student_exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "exam_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "exam_options_student"
            referencedColumns: ["id"]
          },
        ]
      }
      student_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          school_id: string
          student_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          school_id: string
          student_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_chat_messages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_chat_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_url: string
          id: string
          school_id: string
          student_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_url: string
          id?: string
          school_id: string
          student_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          school_id?: string
          student_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_exam_attempts: {
        Row: {
          created_at: string
          end_time: string | null
          exam_id: string
          id: string
          score: number | null
          start_time: string | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          exam_id: string
          id?: string
          score?: number | null
          start_time?: string | null
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          exam_id?: string
          id?: string
          score?: number | null
          start_time?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_exam_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_face_data: {
        Row: {
          created_at: string
          face_descriptor: Json
          id: string
          school_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          face_descriptor: Json
          id?: string
          school_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          face_descriptor?: Json
          id?: string
          school_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_face_data_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_face_data_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_master: {
        Row: {
          address: string | null
          admission_date: string | null
          admission_number: string
          alternate_contact: string | null
          bio: string | null
          blood_group: string | null
          caste_category: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          elective_subjects: string | null
          family_annual_income: string | null
          father_name: string | null
          father_occupation: string | null
          father_phone: string | null
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relation: string | null
          id: string
          joining_date: string | null
          medium_of_instruction: string | null
          mother_name: string | null
          mother_occupation: string | null
          name: string
          parent_email: string | null
          pen_number: string | null
          phone: string | null
          photo_url: string | null
          pincode: string | null
          previous_class_passed: string | null
          previous_school: string | null
          roll_number: string | null
          scholarship_category: string | null
          school_id: string
          second_language: string | null
          state: string | null
          status: string
          tc_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          admission_number: string
          alternate_contact?: string | null
          bio?: string | null
          blood_group?: string | null
          caste_category?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          elective_subjects?: string | null
          family_annual_income?: string | null
          father_name?: string | null
          father_occupation?: string | null
          father_phone?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          id?: string
          joining_date?: string | null
          medium_of_instruction?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          name: string
          parent_email?: string | null
          pen_number?: string | null
          phone?: string | null
          photo_url?: string | null
          pincode?: string | null
          previous_class_passed?: string | null
          previous_school?: string | null
          roll_number?: string | null
          scholarship_category?: string | null
          school_id: string
          second_language?: string | null
          state?: string | null
          status?: string
          tc_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          admission_number?: string
          alternate_contact?: string | null
          bio?: string | null
          blood_group?: string | null
          caste_category?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          elective_subjects?: string | null
          family_annual_income?: string | null
          father_name?: string | null
          father_occupation?: string | null
          father_phone?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          id?: string
          joining_date?: string | null
          medium_of_instruction?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          name?: string
          parent_email?: string | null
          pen_number?: string | null
          phone?: string | null
          photo_url?: string | null
          pincode?: string | null
          previous_class_passed?: string | null
          previous_school?: string | null
          roll_number?: string | null
          scholarship_category?: string | null
          school_id?: string
          second_language?: string | null
          state?: string | null
          status?: string
          tc_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_master_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_year_id: string
          address: string | null
          admission_date: string | null
          admission_number: string
          alternate_contact: string | null
          bio: string | null
          blood_group: string | null
          caste_category: string | null
          city: string | null
          class_id: string | null
          created_at: string
          date_of_birth: string | null
          elective_subjects: string | null
          family_annual_income: string | null
          father_name: string | null
          father_occupation: string | null
          father_phone: string | null
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relation: string | null
          id: string
          joining_date: string | null
          medium_of_instruction: string | null
          mother_name: string | null
          mother_occupation: string | null
          name: string
          parent_email: string | null
          pen_number: string | null
          phone: string | null
          photo_url: string | null
          pincode: string | null
          previous_class_passed: string | null
          previous_school: string | null
          roll_number: string | null
          scholarship_category: string | null
          school_id: string
          second_language: string | null
          section_id: string | null
          state: string | null
          status: string
          student_master_id: string | null
          tc_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          academic_year_id: string
          address?: string | null
          admission_date?: string | null
          admission_number: string
          alternate_contact?: string | null
          bio?: string | null
          blood_group?: string | null
          caste_category?: string | null
          city?: string | null
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          elective_subjects?: string | null
          family_annual_income?: string | null
          father_name?: string | null
          father_occupation?: string | null
          father_phone?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          id?: string
          joining_date?: string | null
          medium_of_instruction?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          name: string
          parent_email?: string | null
          pen_number?: string | null
          phone?: string | null
          photo_url?: string | null
          pincode?: string | null
          previous_class_passed?: string | null
          previous_school?: string | null
          roll_number?: string | null
          scholarship_category?: string | null
          school_id: string
          second_language?: string | null
          section_id?: string | null
          state?: string | null
          status?: string
          student_master_id?: string | null
          tc_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          academic_year_id?: string
          address?: string | null
          admission_date?: string | null
          admission_number?: string
          alternate_contact?: string | null
          bio?: string | null
          blood_group?: string | null
          caste_category?: string | null
          city?: string | null
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          elective_subjects?: string | null
          family_annual_income?: string | null
          father_name?: string | null
          father_occupation?: string | null
          father_phone?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          id?: string
          joining_date?: string | null
          medium_of_instruction?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          name?: string
          parent_email?: string | null
          pen_number?: string | null
          phone?: string | null
          photo_url?: string | null
          pincode?: string | null
          previous_class_passed?: string | null
          previous_school?: string | null
          roll_number?: string | null
          scholarship_category?: string | null
          school_id?: string
          second_language?: string | null
          section_id?: string | null
          state?: string | null
          status?: string
          student_master_id?: string | null
          tc_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_student_master_id_fkey"
            columns: ["student_master_id"]
            isOneToOne: false
            referencedRelation: "student_master"
            referencedColumns: ["id"]
          },
        ]
      }
      study_materials: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string
          description: string | null
          file_name: string | null
          file_url: string | null
          id: string
          material_type: string
          school_id: string
          section_id: string | null
          subject_id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          material_type?: string
          school_id: string
          section_id?: string | null
          subject_id: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          material_type?: string
          school_id?: string
          section_id?: string | null
          subject_id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          school_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          school_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          duration_months: number
          features: Json | null
          id: string
          is_active: boolean
          max_students: number | null
          max_teachers: number | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_months?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          max_students?: number | null
          max_teachers?: number | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_months?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          max_students?: number | null
          max_teachers?: number | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscription_requests: {
        Row: {
          contact_name: string
          created_at: string
          email: string
          id: string
          message: string | null
          phone: string | null
          plan_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          school_name: string
          status: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          phone?: string | null
          plan_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_name: string
          status?: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          phone?: string | null
          plan_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_requests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          payment_amount: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          plan_id: string
          school_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          payment_amount?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan_id: string
          school_id: string
          start_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          payment_amount?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan_id?: string
          school_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string
          id: string
          school_id: string
          section_id: string | null
          subject_id: string
          teacher_id: string
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string
          id?: string
          school_id: string
          section_id?: string | null
          subject_id: string
          teacher_id: string
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string
          id?: string
          school_id?: string
          section_id?: string | null
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          email: string | null
          gender: string | null
          id: string
          joining_date: string | null
          name: string
          phone: string | null
          qualification: string | null
          school_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          gender?: string | null
          id?: string
          joining_date?: string | null
          name: string
          phone?: string | null
          qualification?: string | null
          school_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          gender?: string | null
          id?: string
          joining_date?: string | null
          name?: string
          phone?: string | null
          qualification?: string | null
          school_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_entries: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string
          day_of_week: number
          id: string
          school_id: string
          section_id: string | null
          slot_id: string
          subject_id: string | null
          teacher_id: string | null
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string
          day_of_week: number
          id?: string
          school_id: string
          section_id?: string | null
          slot_id: string
          subject_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string
          day_of_week?: number
          id?: string
          school_id?: string
          section_id?: string | null
          slot_id?: string
          subject_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_entries_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "timetable_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_slots: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_break: boolean
          name: string
          school_id: string
          slot_order: number
          start_time: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_break?: boolean
          name: string
          school_id: string
          slot_order?: number
          start_time: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_break?: boolean
          name?: string
          school_id?: string
          slot_order?: number
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_slots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      exam_options_student: {
        Row: {
          created_at: string | null
          id: string | null
          option_image: string | null
          option_text: string | null
          question_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          option_image?: string | null
          option_text?: string | null
          question_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          option_image?: string | null
          option_text?: string | null
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      school_sms_config_safe: {
        Row: {
          created_at: string | null
          key_configured: boolean | null
          msg91_sender_id: string | null
          msg91_whatsapp_template_id: string | null
          school_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          key_configured?: never
          msg91_sender_id?: string | null
          msg91_whatsapp_template_id?: string | null
          school_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          key_configured?: never
          msg91_sender_id?: string | null
          msg91_whatsapp_template_id?: string | null
          school_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_sms_config_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      activate_festival_theme: {
        Args: { p_theme_id: string }
        Returns: undefined
      }
      deactivate_all_festival_themes: { Args: never; Returns: undefined }
      generate_receipt_number: {
        Args: { p_school_id: string }
        Returns: string
      }
      get_teacher_school_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_school_active: { Args: { p_school_id: string }; Returns: boolean }
      submit_exam: { Args: { p_attempt_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "super_admin" | "school_admin" | "teacher" | "student"
      payment_status: "paid" | "pending" | "failed" | "refunded"
      school_status: "active" | "inactive" | "expired" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "school_admin", "teacher", "student"],
      payment_status: ["paid", "pending", "failed", "refunded"],
      school_status: ["active", "inactive", "expired", "suspended"],
    },
  },
} as const
