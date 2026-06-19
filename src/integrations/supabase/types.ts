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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_name: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_name?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_name?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      anniversaries: {
        Row: {
          created_at: string
          description: string | null
          id: string
          memorial_id: string
          remembrance_date: string
          rsvp_enabled: boolean
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          memorial_id: string
          remembrance_date: string
          rsvp_enabled?: boolean
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          memorial_id?: string
          remembrance_date?: string
          rsvp_enabled?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "anniversaries_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_participations: {
        Row: {
          action_type: string
          amount: number | null
          announcement_id: string
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          message: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          amount?: number | null
          announcement_id: string
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id?: string
          message?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number | null
          announcement_id?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          message?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_participations_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          category: string
          created_at: string
          created_by: string
          event_date: string | null
          id: string
          memorial_id: string | null
          title: string
          venue: string | null
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          created_by: string
          event_date?: string | null
          id?: string
          memorial_id?: string | null
          title: string
          venue?: string | null
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          created_by?: string
          event_date?: string | null
          id?: string
          memorial_id?: string | null
          title?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          image_url: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      condolences: {
        Row: {
          country: string | null
          created_at: string
          id: string
          is_pinned: boolean
          memorial_id: string
          message: string
          name: string
          relationship: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          memorial_id: string
          message: string
          name: string
          relationship?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          memorial_id?: string
          message?: string
          name?: string
          relationship?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "condolences_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          donor_name: string | null
          fundraiser_id: string
          id: string
          is_anonymous: boolean
          message: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          donor_name?: string | null
          fundraiser_id: string
          id?: string
          is_anonymous?: boolean
          message?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          donor_name?: string | null
          fundraiser_id?: string
          id?: string
          is_anonymous?: boolean
          message?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string
          display_order: number
          id: string
          memorial_id: string
          name: string
          notes: string | null
          photo_url: string | null
          relationship: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          memorial_id: string
          name: string
          notes?: string | null
          photo_url?: string | null
          relationship: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          memorial_id?: string
          name?: string
          notes?: string | null
          photo_url?: string | null
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraisers: {
        Row: {
          category: string
          created_at: string
          currency: string
          description: string | null
          goal_amount: number
          id: string
          is_active: boolean
          memorial_id: string
          raised_amount: number
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          goal_amount?: number
          id?: string
          is_active?: boolean
          memorial_id: string
          raised_amount?: number
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          goal_amount?: number
          id?: string
          is_active?: boolean
          memorial_id?: string
          raised_amount?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fundraisers_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          },
        ]
      }
      memorial_admins: {
        Row: {
          created_at: string
          id: string
          memorial_id: string
          permissions: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          memorial_id: string
          permissions?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          memorial_id?: string
          permissions?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorial_admins_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          },
        ]
      }
      memorials: {
        Row: {
          biography: string | null
          burial_details: string | null
          cover_photo_url: string | null
          created_at: string
          created_by: string
          date_of_birth: string | null
          date_of_death: string | null
          full_name: string
          gender: string | null
          id: string
          is_public: boolean
          location: string | null
          map_url: string | null
          profile_photo_url: string | null
          program_pdf_url: string | null
          service_schedule: string | null
          short_tribute: string | null
          updated_at: string
          venue: string | null
          visitor_count: number
        }
        Insert: {
          biography?: string | null
          burial_details?: string | null
          cover_photo_url?: string | null
          created_at?: string
          created_by: string
          date_of_birth?: string | null
          date_of_death?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          map_url?: string | null
          profile_photo_url?: string | null
          program_pdf_url?: string | null
          service_schedule?: string | null
          short_tribute?: string | null
          updated_at?: string
          venue?: string | null
          visitor_count?: number
        }
        Update: {
          biography?: string | null
          burial_details?: string | null
          cover_photo_url?: string | null
          created_at?: string
          created_by?: string
          date_of_birth?: string | null
          date_of_death?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          map_url?: string | null
          profile_photo_url?: string | null
          program_pdf_url?: string | null
          service_schedule?: string | null
          short_tribute?: string | null
          updated_at?: string
          venue?: string | null
          visitor_count?: number
        }
        Relationships: []
      }
      memories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          memorial_id: string
          memory_date: string | null
          photo_url: string | null
          photos: string[]
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          memorial_id: string
          memory_date?: string | null
          photo_url?: string | null
          photos?: string[]
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          memorial_id?: string
          memory_date?: string | null
          photo_url?: string | null
          photos?: string[]
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memories_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorials"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_memorial_admin: {
        Args: { _memorial_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin" | "memorial_admin" | "mourner"
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
      app_role: ["admin", "user", "super_admin", "memorial_admin", "mourner"],
    },
  },
} as const
