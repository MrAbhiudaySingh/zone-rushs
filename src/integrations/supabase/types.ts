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
      clan_members: {
        Row: {
          clan_id: string
          clan_role: string
          contribution_points: number
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          clan_id: string
          clan_role?: string
          contribution_points?: number
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          clan_id?: string
          clan_role?: string
          contribution_points?: number
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_members_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clans: {
        Row: {
          aether_treasury: number
          color: string
          cpr_score: number
          created_at: string
          description: string | null
          id: string
          last_leader_active_at: string | null
          leader_id: string | null
          max_members: number
          motto: string | null
          name: string
          rank: number | null
          tag: string
          total_members: number
          updated_at: string
          zones_held: number
        }
        Insert: {
          aether_treasury?: number
          color?: string
          cpr_score?: number
          created_at?: string
          description?: string | null
          id?: string
          last_leader_active_at?: string | null
          leader_id?: string | null
          max_members?: number
          motto?: string | null
          name: string
          rank?: number | null
          tag: string
          total_members?: number
          updated_at?: string
          zones_held?: number
        }
        Update: {
          aether_treasury?: number
          color?: string
          cpr_score?: number
          created_at?: string
          description?: string | null
          id?: string
          last_leader_active_at?: string | null
          leader_id?: string | null
          max_members?: number
          motto?: string | null
          name?: string
          rank?: number | null
          tag?: string
          total_members?: number
          updated_at?: string
          zones_held?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aether: number
          avatar_config: Json | null
          avatar_data_url: string | null
          combat_rank: string
          course: string | null
          created_at: string
          display_name: string
          id: string
          influence_rank: string
          level: number
          roll_number: string | null
          shards: number
          shields: number
          specialisation: string | null
          streak: number
          updated_at: string
          user_id: string
          xp: number
          xp_next: number
          year: string | null
        }
        Insert: {
          aether?: number
          avatar_config?: Json | null
          avatar_data_url?: string | null
          combat_rank?: string
          course?: string | null
          created_at?: string
          display_name?: string
          id?: string
          influence_rank?: string
          level?: number
          roll_number?: string | null
          shards?: number
          shields?: number
          specialisation?: string | null
          streak?: number
          updated_at?: string
          user_id: string
          xp?: number
          xp_next?: number
          year?: string | null
        }
        Update: {
          aether?: number
          avatar_config?: Json | null
          avatar_data_url?: string | null
          combat_rank?: string
          course?: string | null
          created_at?: string
          display_name?: string
          id?: string
          influence_rank?: string
          level?: number
          roll_number?: string | null
          shards?: number
          shields?: number
          specialisation?: string | null
          streak?: number
          updated_at?: string
          user_id?: string
          xp?: number
          xp_next?: number
          year?: string | null
        }
        Relationships: []
      }
      quest_definitions: {
        Row: {
          aether_reward: number
          category: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          requires_clan: boolean
          shard_reward: number
          sort_order: number
          target_value: number
          tier: string
          title: string
          tracking_type: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          aether_reward?: number
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          requires_clan?: boolean
          shard_reward?: number
          sort_order?: number
          target_value?: number
          tier?: string
          title: string
          tracking_type?: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          aether_reward?: number
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          requires_clan?: boolean
          shard_reward?: number
          sort_order?: number
          target_value?: number
          tier?: string
          title?: string
          tracking_type?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      quest_progress: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          current_value: number
          id: string
          period_end: string | null
          period_start: string
          quest_definition_id: string
          status: string
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          period_end?: string | null
          period_start?: string
          quest_definition_id: string
          status?: string
          target_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          period_end?: string | null
          period_start?: string
          quest_definition_id?: string
          status?: string
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_progress_quest_definition_id_fkey"
            columns: ["quest_definition_id"]
            isOneToOne: false
            referencedRelation: "quest_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_proofs: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          proof_type: string
          proof_url: string | null
          quest_progress_id: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          proof_type?: string
          proof_url?: string | null
          quest_progress_id: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          proof_type?: string
          proof_url?: string | null
          quest_progress_id?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "quest_proofs_quest_progress_id_fkey"
            columns: ["quest_progress_id"]
            isOneToOne: false
            referencedRelation: "quest_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_captures: {
        Row: {
          attacker_user_id: string
          attacking_clan_id: string
          created_at: string
          id: string
          status: string
          timer_paused_at: string | null
          timer_started_at: string
          total_paused_seconds: number
          zone_id: string
        }
        Insert: {
          attacker_user_id: string
          attacking_clan_id: string
          created_at?: string
          id?: string
          status?: string
          timer_paused_at?: string | null
          timer_started_at?: string
          total_paused_seconds?: number
          zone_id: string
        }
        Update: {
          attacker_user_id?: string
          attacking_clan_id?: string
          created_at?: string
          id?: string
          status?: string
          timer_paused_at?: string | null
          timer_started_at?: string
          total_paused_seconds?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_captures_attacking_clan_id_fkey"
            columns: ["attacking_clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_captures_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          aether_rate_per_hour: number
          contest_status: string
          control_strength: number
          created_at: string
          development_level: number
          geo_polygon: Json | null
          id: string
          last_capture_at: string | null
          latitude: number
          longitude: number
          name: string
          owner_clan_id: string | null
          recapture_cooldown_until: string | null
          tier: number
          zone_type: string
        }
        Insert: {
          aether_rate_per_hour?: number
          contest_status?: string
          control_strength?: number
          created_at?: string
          development_level?: number
          geo_polygon?: Json | null
          id?: string
          last_capture_at?: string | null
          latitude: number
          longitude: number
          name: string
          owner_clan_id?: string | null
          recapture_cooldown_until?: string | null
          tier?: number
          zone_type?: string
        }
        Update: {
          aether_rate_per_hour?: number
          contest_status?: string
          control_strength?: number
          created_at?: string
          development_level?: number
          geo_polygon?: Json | null
          id?: string
          last_capture_at?: string | null
          latitude?: number
          longitude?: number
          name?: string
          owner_clan_id?: string | null
          recapture_cooldown_until?: string | null
          tier?: number
          zone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_owner_clan_id_fkey"
            columns: ["owner_clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
