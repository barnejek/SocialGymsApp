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
      gam_achievements: {
        Row: {
          description: string
          icon: string
          id: string
          title: string
        }
        Insert: {
          description: string
          icon?: string
          id: string
          title: string
        }
        Update: {
          description?: string
          icon?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      gam_paths: {
        Row: {
          icon: string
          id: string
          requires_adult: boolean
          sort: number
          tagline: string
          title: string
        }
        Insert: {
          icon?: string
          id: string
          requires_adult?: boolean
          sort?: number
          tagline?: string
          title: string
        }
        Update: {
          icon?: string
          id?: string
          requires_adult?: boolean
          sort?: number
          tagline?: string
          title?: string
        }
        Relationships: []
      }
      gam_quests: {
        Row: {
          description: string
          id: string
          metric: string
          reps_reward: number
          target: number
        }
        Insert: {
          description: string
          id: string
          metric: string
          reps_reward: number
          target?: number
        }
        Update: {
          description?: string
          id?: string
          metric?: string
          reps_reward?: number
          target?: number
        }
        Relationships: []
      }
      gam_rep_events: {
        Row: {
          amount: number
          created_at: string
          id: number
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: never
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: never
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      gam_sessions: {
        Row: {
          composite: number
          created_at: string
          id: string
          level_attempted: number
          scores: Json
          skill_id: string
          user_id: string
          was_challenge: boolean
          xp_awarded: number
        }
        Insert: {
          composite: number
          created_at?: string
          id?: string
          level_attempted?: number
          scores: Json
          skill_id: string
          user_id: string
          was_challenge?: boolean
          xp_awarded?: number
        }
        Update: {
          composite?: number
          created_at?: string
          id?: string
          level_attempted?: number
          scores?: Json
          skill_id?: string
          user_id?: string
          was_challenge?: boolean
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "gam_sessions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "gam_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      gam_skill_progress: {
        Row: {
          best_composite: number
          last_trained_at: string | null
          mastery: number
          sessions_count: number
          skill_id: string
          user_id: string
        }
        Insert: {
          best_composite?: number
          last_trained_at?: string | null
          mastery?: number
          sessions_count?: number
          skill_id: string
          user_id: string
        }
        Update: {
          best_composite?: number
          last_trained_at?: string | null
          mastery?: number
          sessions_count?: number
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gam_skill_progress_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "gam_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      gam_skills: {
        Row: {
          id: string
          path_id: string
          payoff_line: string
          sort: number
          tier: number
          title: string
          topic_id: string | null
        }
        Insert: {
          id: string
          path_id: string
          payoff_line?: string
          sort?: number
          tier: number
          title: string
          topic_id?: string | null
        }
        Update: {
          id?: string
          path_id?: string
          payoff_line?: string
          sort?: number
          tier?: number
          title?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gam_skills_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "gam_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      gam_user_achievements: {
        Row: {
          achievement_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gam_user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "gam_achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      gam_user_quests: {
        Row: {
          completed: boolean
          progress: number
          quest_date: string
          quest_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          progress?: number
          quest_date: string
          quest_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          progress?: number
          quest_date?: string
          quest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gam_user_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "gam_quests"
            referencedColumns: ["id"]
          },
        ]
      }
      gam_user_stats: {
        Row: {
          current_streak: number
          last_active_date: string | null
          level: number
          longest_streak: number
          reps: number
          streak_freezes: number
          total_xp: number
          tz: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          reps?: number
          streak_freezes?: number
          total_xp?: number
          tz?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          reps?: number
          streak_freezes?: number
          total_xp?: number
          tz?: string
          user_id?: string
        }
        Relationships: []
      }
      gam_xp_events: {
        Row: {
          amount: number
          created_at: string
          id: number
          reason: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: never
          reason: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: never
          reason?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gam_xp_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "gam_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          is_adult: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          is_adult?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          is_adult?: boolean
          user_id?: string
        }
        Relationships: []
      }
      technique_cards: {
        Row: {
          age_variant: string
          contraindications: string | null
          created_at: string
          definition: string
          embedding: string | null
          example_phrasing: string[]
          family: string
          id: string
          mechanism: string
          name: string
          reviewed_at: string
          reviewed_by: string
          source_citation: string
          topics: string[]
          trigger_gaps: string[]
          version: number
        }
        Insert: {
          age_variant?: string
          contraindications?: string | null
          created_at?: string
          definition: string
          embedding?: string | null
          example_phrasing?: string[]
          family: string
          id?: string
          mechanism: string
          name: string
          reviewed_at?: string
          reviewed_by: string
          source_citation: string
          topics?: string[]
          trigger_gaps?: string[]
          version?: number
        }
        Update: {
          age_variant?: string
          contraindications?: string | null
          created_at?: string
          definition?: string
          embedding?: string | null
          example_phrasing?: string[]
          family?: string
          id?: string
          mechanism?: string
          name?: string
          reviewed_at?: string
          reviewed_by?: string
          source_citation?: string
          topics?: string[]
          trigger_gaps?: string[]
          version?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_session_rewards: {
        Args: { p_scores: Json; p_skill: string; p_user: string }
        Returns: Json
      }
      gam_composite: { Args: { a: Json }; Returns: number }
      gam_ensure_profile: {
        Args: { p_display_name?: string }
        Returns: undefined
      }
      gam_get_state: { Args: never; Returns: Json }
      gam_is_skill_unlocked: {
        Args: { p_skill: string; p_user: string }
        Returns: boolean
      }
      gam_level_from_xp: { Args: { p_xp: number }; Returns: number }
      gam_set_adult_attestation: { Args: never; Returns: undefined }
      match_technique_cards: {
        Args: {
          filter_age_variant: string
          filter_topic: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          age_variant: string
          contraindications: string | null
          created_at: string
          definition: string
          embedding: string | null
          example_phrasing: string[]
          family: string
          id: string
          mechanism: string
          name: string
          reviewed_at: string
          reviewed_by: string
          source_citation: string
          topics: string[]
          trigger_gaps: string[]
          version: number
        }[]
        SetofOptions: {
          from: "*"
          to: "technique_cards"
          isOneToOne: false
          isSetofReturn: true
        }
      }
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
