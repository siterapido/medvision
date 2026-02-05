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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      artifacts: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          type: "chat" | "document" | "code" | "image" | "research" | "exam" | "summary" | "flashcards" | "mindmap" | "report" | "other"
          content: Json
          metadata: Json | null
          ai_context: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          type?: "chat" | "document" | "code" | "image" | "research" | "exam" | "summary" | "flashcards" | "mindmap" | "report" | "other"
          content: Json
          metadata?: Json | null
          ai_context: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          type?: "chat" | "document" | "code" | "image" | "research" | "exam" | "summary" | "flashcards" | "mindmap" | "report" | "other"
          content?: Json
          metadata?: Json | null
          ai_context?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      activities: {
        Row: {
          activity_type: string
          color: string | null
          created_at: string
          id: number
          label: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          color?: string | null
          created_at?: string
          id?: never
          label: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          color?: string | null
          created_at?: string
          id?: never
          label?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      Chat: {
        Row: {
          createdAt: string
          id: string
          lastContext: Json | null
          title: string
          userId: string
          visibility: string
        }
        Insert: {
          createdAt: string
          id?: string
          lastContext?: Json | null
          title: string
          userId: string
          visibility?: string
        }
        Update: {
          createdAt?: string
          id?: string
          lastContext?: Json | null
          title?: string
          userId?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "Chat_userId_User_id_fk"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: number
          metadata: Json | null
          role: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: never
          metadata?: Json | null
          role: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: never
          metadata?: Json | null
          role?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_category_map: {
        Row: {
          category_id: string
          course_id: string
          created_at: string
        }
        Insert: {
          category_id: string
          course_id: string
          created_at?: string
        }
        Update: {
          category_id?: string
          course_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_category_map_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "course_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_category_map_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_courses_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_category_map_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_collection_courses: {
        Row: {
          badge_override: string | null
          collection_id: string
          course_id: string
          created_at: string
          highlight_message: string | null
          position: number | null
        }
        Insert: {
          badge_override?: string | null
          collection_id: string
          course_id: string
          created_at?: string
          highlight_message?: string | null
          position?: number | null
        }
        Update: {
          badge_override?: string | null
          collection_id?: string
          course_id?: string
          created_at?: string
          highlight_message?: string | null
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_collection_courses_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "course_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_collection_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_courses_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_collection_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_collections: {
        Row: {
          badge_class: string | null
          badge_text: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          label: string | null
          position: number | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          badge_class?: string | null
          badge_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          position?: number | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          badge_class?: string | null
          badge_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          position?: number | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_instructor_courses: {
        Row: {
          course_id: string
          created_at: string
          instructor_id: string
          role: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          instructor_id: string
          role?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          instructor_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_instructor_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_courses_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_instructor_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_instructor_courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "course_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      course_instructors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string
          headline: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name: string
          headline?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          headline?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      course_purchases: {
        Row: {
          amount: number | null
          course_id: string
          created_at: string
          id: string
          status: string | null
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          course_id: string
          created_at?: string
          id?: string
          status?: string | null
          transaction_id: string
          user_id: string
        }
        Update: {
          amount?: number | null
          course_id?: string
          created_at?: string
          id?: string
          status?: string | null
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_courses_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_resources: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_downloadable: boolean | null
          lesson_id: string | null
          position: number | null
          resource_type: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_downloadable?: boolean | null
          lesson_id?: string | null
          position?: number | null
          resource_type: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_downloadable?: boolean | null
          lesson_id?: string | null
          position?: number | null
          resource_type?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_courses_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tag_map: {
        Row: {
          course_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_tag_map_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_courses_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_tag_map_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_tag_map_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "course_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          label: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          label: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          area: string | null
          available_at: string | null
          cakto_product_id: string | null
          coming_soon: boolean
          course_type: string
          created_at: string
          description: string
          difficulty: string | null
          duration: string | null
          duration_minutes: number | null
          format: string | null
          id: string
          is_published: boolean | null
          lessons_count: number | null
          order_index: number
          price: string | null
          published_at: string | null
          tags: string | null
          thumbnail: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          available_at?: string | null
          cakto_product_id?: string | null
          coming_soon?: boolean
          course_type?: string
          created_at?: string
          description: string
          difficulty?: string | null
          duration?: string | null
          duration_minutes?: number | null
          format?: string | null
          id?: string
          is_published?: boolean | null
          lessons_count?: number | null
          order_index?: number
          price?: string | null
          published_at?: string | null
          tags?: string | null
          thumbnail?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          available_at?: string | null
          cakto_product_id?: string | null
          coming_soon?: boolean
          course_type?: string
          created_at?: string
          description?: string
          difficulty?: string | null
          duration?: string | null
          duration_minutes?: number | null
          format?: string | null
          id?: string
          is_published?: boolean | null
          lessons_count?: number | null
          order_index?: number
          price?: string | null
          published_at?: string | null
          tags?: string | null
          thumbnail?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Relationships: []
      }
      Document: {
        Row: {
          content: string | null
          createdAt: string
          id: string
          text: string
          title: string
          userId: string
        }
        Insert: {
          content?: string | null
          createdAt: string
          id?: string
          text?: string
          title: string
          userId: string
        }
        Update: {
          content?: string | null
          createdAt?: string
          id?: string
          text?: string
          title?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Document_userId_User_id_fk"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_modules: {
        Row: {
          access_type: string | null
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          access_type?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          access_type?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_courses_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          available_at: string | null
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          materials: Json | null
          module_id: string | null
          module_title: string | null
          order_index: number
          title: string
          video_url: string
        }
        Insert: {
          available_at?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          materials?: Json | null
          module_id?: string | null
          module_title?: string | null
          order_index?: number
          title: string
          video_url: string
        }
        Update: {
          available_at?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          materials?: Json | null
          module_id?: string | null
          module_title?: string | null
          order_index?: number
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_courses_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "lesson_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      live_event_reminders: {
        Row: {
          created_at: string
          event_id: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: never
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_event_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "live_events"
            referencedColumns: ["id"]
          },
        ]
      }
      live_events: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          instructor_name: string | null
          is_featured: boolean | null
          live_url: string | null
          start_at: string
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instructor_name?: string | null
          is_featured?: boolean | null
          live_url?: string | null
          start_at: string
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instructor_name?: string | null
          is_featured?: boolean | null
          live_url?: string | null
          start_at?: string
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      Message: {
        Row: {
          chatId: string
          content: Json
          createdAt: string
          id: string
          role: string
        }
        Insert: {
          chatId: string
          content: Json
          createdAt: string
          id?: string
          role: string
        }
        Update: {
          chatId?: string
          content?: Json
          createdAt?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "Message_chatId_Chat_id_fk"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "Chat"
            referencedColumns: ["id"]
          },
        ]
      }
      Message_v2: {
        Row: {
          attachments: Json
          chatId: string
          createdAt: string
          id: string
          parts: Json
          role: string
        }
        Insert: {
          attachments: Json
          chatId: string
          createdAt: string
          id?: string
          parts: Json
          role: string
        }
        Update: {
          attachments?: Json
          chatId?: string
          createdAt?: string
          id?: string
          parts?: Json
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "Message_v2_chatId_Chat_id_fk"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "Chat"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          channel: string | null
          content: string | null
          error_message: string | null
          id: string
          response_data: Json | null
          sent_at: string | null
          status: string
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          channel?: string | null
          content?: string | null
          error_message?: string | null
          id?: string
          response_data?: Json | null
          sent_at?: string | null
          status: string
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string | null
          content?: string | null
          error_message?: string | null
          id?: string
          response_data?: Json | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          active: boolean | null
          channel: string
          content: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          subject: string | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          channel?: string
          content: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          subject?: string | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          channel?: string
          content?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          subject?: string | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: number
          payment_method: string | null
          status: string | null
          transaction_id: string | null
          user_id: string | null
          webhook_data: Json | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: number
          payment_method?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
          webhook_data?: Json | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: number
          payment_method?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
          webhook_data?: Json | null
        }
        Relationships: []
      }
      pipeline_notes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          note: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          note: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          note?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_source: string | null
          assigned_to: string | null
          avatar_url: string | null
          company: string | null
          conversation_count: number | null
          cpf: string | null
          created_at: string
          cro: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          engagement_score: number | null
          especialidade: string | null
          expires_at: string | null
          funnel_id: string | null
          id: string
          institution: string | null
          knowledge_gaps: string[] | null
          last_activity_at: string | null
          last_active_at: string | null
          last_payment_date: string | null
          learning_style: string | null
          mastered_topics: string[] | null
          name: string | null
          nome_completo: string | null
          payment_method: string | null
          phone: string | null
          phone_verified: boolean | null
          phone_verified_at: string | null
          pipeline_stage: string | null
          plan: string
          plan_type: string | null
          profession: string | null
          response_preference: string | null
          role: string
          setup_completed_at: string | null
          setup_level: string | null
          subscription_status: string | null
          telefone: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
          trial_used: boolean | null
          updated_at: string
          whatsapp: string | null
          whatsapp_optin: boolean | null
          whatsapp_optin_at: string | null
          whatsapp_optout_at: string | null
        }
        Insert: {
          account_source?: string | null
          assigned_to?: string | null
          avatar_url?: string | null
          company?: string | null
          conversation_count?: number | null
          cpf?: string | null
          created_at?: string
          cro?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          engagement_score?: number | null
          especialidade?: string | null
          expires_at?: string | null
          funnel_id?: string | null
          id: string
          institution?: string | null
          knowledge_gaps?: string[] | null
          last_activity_at?: string | null
          last_active_at?: string | null
          last_payment_date?: string | null
          learning_style?: string | null
          mastered_topics?: string[] | null
          name?: string | null
          nome_completo?: string | null
          payment_method?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          phone_verified_at?: string | null
          pipeline_stage?: string | null
          plan?: string
          plan_type?: string | null
          profession?: string | null
          response_preference?: string | null
          role?: string
          setup_completed_at?: string | null
          setup_level?: string | null
          subscription_status?: string | null
          telefone?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          trial_used?: boolean | null
          updated_at?: string
          whatsapp?: string | null
          whatsapp_optin?: boolean | null
          whatsapp_optin_at?: string | null
          whatsapp_optout_at?: string | null
        }
        Update: {
          account_source?: string | null
          assigned_to?: string | null
          avatar_url?: string | null
          company?: string | null
          conversation_count?: number | null
          cpf?: string | null
          created_at?: string
          cro?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          engagement_score?: number | null
          especialidade?: string | null
          expires_at?: string | null
          funnel_id?: string | null
          id?: string
          institution?: string | null
          knowledge_gaps?: string[] | null
          last_activity_at?: string | null
          last_active_at?: string | null
          last_payment_date?: string | null
          learning_style?: string | null
          mastered_topics?: string[] | null
          name?: string | null
          nome_completo?: string | null
          payment_method?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          phone_verified_at?: string | null
          pipeline_stage?: string | null
          plan?: string
          plan_type?: string | null
          profession?: string | null
          response_preference?: string | null
          role?: string
          setup_completed_at?: string | null
          setup_level?: string | null
          subscription_status?: string | null
          telefone?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          trial_used?: boolean | null
          updated_at?: string
          whatsapp?: string | null
          whatsapp_optin?: boolean | null
          whatsapp_optin_at?: string | null
          whatsapp_optout_at?: string | null
        }
        Relationships: []
      }
      Stream: {
        Row: {
          chatId: string
          createdAt: string
          id: string
        }
        Insert: {
          chatId: string
          createdAt: string
          id?: string
        }
        Update: {
          chatId?: string
          createdAt?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Stream_chatId_Chat_id_fk"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "Chat"
            referencedColumns: ["id"]
          },
        ]
      }
      Suggestion: {
        Row: {
          createdAt: string
          description: string | null
          documentCreatedAt: string
          documentId: string
          id: string
          isResolved: boolean
          originalText: string
          suggestedText: string
          userId: string
        }
        Insert: {
          createdAt: string
          description?: string | null
          documentCreatedAt: string
          documentId: string
          id?: string
          isResolved?: boolean
          originalText: string
          suggestedText: string
          userId: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          documentCreatedAt?: string
          documentId?: string
          id?: string
          isResolved?: boolean
          originalText?: string
          suggestedText?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_f"
            columns: ["documentId", "documentCreatedAt"]
            isOneToOne: false
            referencedRelation: "Document"
            referencedColumns: ["id", "createdAt"]
          },
          {
            foreignKeyName: "Suggestion_userId_User_id_fk"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_logs: {
        Row: {
          amount: number | null
          created_at: string | null
          customer_cpf: string | null
          customer_email: string | null
          customer_name: string | null
          error_message: string | null
          event_type: string | null
          id: string
          status: string | null
          transaction_id: string | null
          user_id: string | null
          webhook_payload: Json | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
          webhook_payload?: Json | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
          webhook_payload?: Json | null
        }
        Relationships: []
      }
      User: {
        Row: {
          email: string
          id: string
          password: string | null
        }
        Insert: {
          email: string
          id?: string
          password?: string | null
        }
        Update: {
          email?: string
          id?: string
          password?: string | null
        }
        Relationships: []
      }
      user_courses: {
        Row: {
          course_id: string
          id: number
          progress: number | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          id?: never
          progress?: number | null
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          id?: never
          progress?: number | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_courses_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lessons: {
        Row: {
          completed_at: string | null
          id: number
          is_completed: boolean | null
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: never
          is_completed?: boolean | null
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: never
          is_completed?: boolean | null
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lessons_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      Vote: {
        Row: {
          chatId: string
          isUpvoted: boolean
          messageId: string
        }
        Insert: {
          chatId: string
          isUpvoted: boolean
          messageId: string
        }
        Update: {
          chatId?: string
          isUpvoted?: boolean
          messageId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Vote_chatId_Chat_id_fk"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "Chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Vote_messageId_Message_id_fk"
            columns: ["messageId"]
            isOneToOne: false
            referencedRelation: "Message"
            referencedColumns: ["id"]
          },
        ]
      }
      Vote_v2: {
        Row: {
          chatId: string
          isUpvoted: boolean
          messageId: string
        }
        Insert: {
          chatId: string
          isUpvoted: boolean
          messageId: string
        }
        Update: {
          chatId?: string
          isUpvoted?: boolean
          messageId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Vote_v2_chatId_Chat_id_fk"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "Chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Vote_v2_messageId_Message_v2_id_fk"
            columns: ["messageId"]
            isOneToOne: false
            referencedRelation: "Message_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string | null
          event_id: string | null
          event_type: string | null
          id: number
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          event_type?: string | null
          id?: number
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          event_type?: string | null
          id?: number
        }
        Relationships: []
      }
    }
    Views: {
      admin_courses_with_stats: {
        Row: {
          area: string | null
          course_type: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration: string | null
          duration_minutes: number | null
          format: string | null
          id: string | null
          is_published: boolean | null
          lessons: Json | null
          lessons_count: number | null
          price: string | null
          published_at: string | null
          tags: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
