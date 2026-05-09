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
          banner_emoji: string | null
          color: string
          cpr_score: number
          created_at: string
          description: string | null
          id: string
          is_open: boolean
          last_leader_active_at: string | null
          leader_id: string | null
          max_members: number
          motto: string | null
          name: string
          rank: number | null
          tag: string
          total_members: number
          treasury: number
          updated_at: string
          weekly_xp: number
          zones_held: number
        }
        Insert: {
          aether_treasury?: number
          banner_emoji?: string | null
          color?: string
          cpr_score?: number
          created_at?: string
          description?: string | null
          id?: string
          is_open?: boolean
          last_leader_active_at?: string | null
          leader_id?: string | null
          max_members?: number
          motto?: string | null
          name: string
          rank?: number | null
          tag: string
          total_members?: number
          treasury?: number
          updated_at?: string
          weekly_xp?: number
          zones_held?: number
        }
        Update: {
          aether_treasury?: number
          banner_emoji?: string | null
          color?: string
          cpr_score?: number
          created_at?: string
          description?: string | null
          id?: string
          is_open?: boolean
          last_leader_active_at?: string | null
          leader_id?: string | null
          max_members?: number
          motto?: string | null
          name?: string
          rank?: number | null
          tag?: string
          total_members?: number
          treasury?: number
          updated_at?: string
          weekly_xp?: number
          zones_held?: number
        }
        Relationships: []
      }
      event_participants: {
        Row: {
          event_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_qr_codes: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          max_redemptions: number | null
          redeemed_count: number
          reward_label: string | null
          reward_type: string
          reward_value_int: number | null
          reward_value_text: string | null
          token: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          max_redemptions?: number | null
          redeemed_count?: number
          reward_label?: string | null
          reward_type: string
          reward_value_int?: number | null
          reward_value_text?: string | null
          token: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          max_redemptions?: number | null
          redeemed_count?: number
          reward_label?: string | null
          reward_type?: string
          reward_value_int?: number | null
          reward_value_text?: string | null
          token?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_qr_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_qr_redemptions: {
        Row: {
          id: string
          qr_code_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          id?: string
          qr_code_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          id?: string
          qr_code_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_qr_redemptions_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "event_qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      event_qr_scan_attempts: {
        Row: {
          attempt_token: string | null
          created_at: string
          id: string
          outcome: string
          qr_code_id: string | null
          user_id: string | null
        }
        Insert: {
          attempt_token?: string | null
          created_at?: string
          id?: string
          outcome: string
          qr_code_id?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_token?: string | null
          created_at?: string
          id?: string
          outcome?: string
          qr_code_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_qr_scan_attempts_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "event_qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          date_end: string | null
          date_start: string | null
          description: string | null
          ends_at: string | null
          id: string
          qr_enabled: boolean
          reward_ae: number
          starts_at: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          date_end?: string | null
          date_start?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          qr_enabled?: boolean
          reward_ae?: number
          starts_at?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          date_end?: string | null
          date_start?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          qr_enabled?: boolean
          reward_ae?: number
          starts_at?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      game_config: {
        Row: {
          id: string
          key: string
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: string | null
        }
        Relationships: []
      }
      google_fit_tokens: {
        Row: {
          access_token: string | null
          connected: boolean
          created_at: string
          daily_steps: number
          id: string
          last_synced_at: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connected?: boolean
          created_at?: string
          daily_steps?: number
          id?: string
          last_synced_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          connected?: boolean
          created_at?: string
          daily_steps?: number
          id?: string
          last_synced_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          anon_user_hash: string
          created_at: string
          crisis_flag: boolean
          free_text: string | null
          id: string
          mood_score: number
          outreach_contacted_at: string | null
          outreach_requested: boolean
        }
        Insert: {
          anon_user_hash: string
          created_at?: string
          crisis_flag?: boolean
          free_text?: string | null
          id?: string
          mood_score: number
          outreach_contacted_at?: string | null
          outreach_requested?: boolean
        }
        Update: {
          anon_user_hash?: string
          created_at?: string
          crisis_flag?: boolean
          free_text?: string | null
          id?: string
          mood_score?: number
          outreach_contacted_at?: string | null
          outreach_requested?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aether: number
          avatar_config: Json | null
          avatar_data_url: string | null
          clan_id: string | null
          combat_rank: string
          course: string | null
          created_at: string
          display_name: string
          id: string
          influence_points: number
          influence_rank: string
          level: number
          missions_completed: number
          roll_number: string | null
          shards: number
          shields: number
          specialisation: string | null
          story_clues: number
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
          clan_id?: string | null
          combat_rank?: string
          course?: string | null
          created_at?: string
          display_name?: string
          id?: string
          influence_points?: number
          influence_rank?: string
          level?: number
          missions_completed?: number
          roll_number?: string | null
          shards?: number
          shields?: number
          specialisation?: string | null
          story_clues?: number
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
          clan_id?: string | null
          combat_rank?: string
          course?: string | null
          created_at?: string
          display_name?: string
          id?: string
          influence_points?: number
          influence_rank?: string
          level?: number
          missions_completed?: number
          roll_number?: string | null
          shards?: number
          shields?: number
          specialisation?: string | null
          story_clues?: number
          streak?: number
          updated_at?: string
          user_id?: string
          xp?: number
          xp_next?: number
          year?: string | null
        }
        Relationships: []
      }
      proof_submissions: {
        Row: {
          id: string
          proof_url: string | null
          quest_progress_id: string
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          proof_url?: string | null
          quest_progress_id: string
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          proof_url?: string | null
          quest_progress_id?: string
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proof_submissions_quest_progress_id_fkey"
            columns: ["quest_progress_id"]
            isOneToOne: false
            referencedRelation: "quest_progress"
            referencedColumns: ["id"]
          },
        ]
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
      shop_items: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          price_ae: number
          price_shards: number
          soul_bound: boolean
          stock: number | null
          svg_asset_url: string | null
          tier: string
          tradeable: boolean
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price_ae?: number
          price_shards?: number
          soul_bound?: boolean
          stock?: number | null
          svg_asset_url?: string | null
          tier?: string
          tradeable?: boolean
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price_ae?: number
          price_shards?: number
          soul_bound?: boolean
          stock?: number | null
          svg_asset_url?: string | null
          tier?: string
          tradeable?: boolean
        }
        Relationships: []
      }
      story_chapters: {
        Row: {
          accent_color: string | null
          art_emoji: string | null
          chapter_num: number
          clues: Json | null
          created_at: string
          id: string
          status: string | null
          subtitle: string | null
          summary: string | null
          title: string
          total_clues: number | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          art_emoji?: string | null
          chapter_num: number
          clues?: Json | null
          created_at?: string
          id?: string
          status?: string | null
          subtitle?: string | null
          summary?: string | null
          title: string
          total_clues?: number | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          art_emoji?: string | null
          chapter_num?: number
          clues?: Json | null
          created_at?: string
          id?: string
          status?: string | null
          subtitle?: string | null
          summary?: string | null
          title?: string
          total_clues?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      story_progress: {
        Row: {
          chapter_id: string
          clue_index: number
          completed_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          clue_index?: number
          completed_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          clue_index?: number
          completed_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      style_events: {
        Row: {
          created_at: string
          id: string
          status: string
          theme_description: string | null
          theme_title: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          theme_description?: string | null
          theme_title: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          theme_description?: string | null
          theme_title?: string
          week_start?: string
        }
        Relationships: []
      }
      style_submissions: {
        Row: {
          approval_status: string
          description: string | null
          design_png_url: string | null
          id: string
          is_winner: boolean
          status: string
          style_event_id: string
          submitted_at: string
          title: string
          user_id: string
          vote_count: number
        }
        Insert: {
          approval_status?: string
          description?: string | null
          design_png_url?: string | null
          id?: string
          is_winner?: boolean
          status?: string
          style_event_id: string
          submitted_at?: string
          title: string
          user_id: string
          vote_count?: number
        }
        Update: {
          approval_status?: string
          description?: string | null
          design_png_url?: string | null
          id?: string
          is_winner?: boolean
          status?: string
          style_event_id?: string
          submitted_at?: string
          title?: string
          user_id?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "style_submissions_style_event_id_fkey"
            columns: ["style_event_id"]
            isOneToOne: false
            referencedRelation: "style_events"
            referencedColumns: ["id"]
          },
        ]
      }
      treasury_log: {
        Row: {
          action: string
          amount: number | null
          amount_ae: number
          clan_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          type: string | null
        }
        Insert: {
          action: string
          amount?: number | null
          amount_ae?: number
          clan_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          type?: string | null
        }
        Update: {
          action?: string
          amount?: number | null
          amount_ae?: number
          clan_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treasury_log_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          acquired_at: string
          acquired_via: string | null
          den_slot: string | null
          equipped: boolean
          id: string
          item_id: string
          listed_for_sale: boolean
          quantity: number
          sale_price_ae: number | null
          user_id: string
        }
        Insert: {
          acquired_at?: string
          acquired_via?: string | null
          den_slot?: string | null
          equipped?: boolean
          id?: string
          item_id: string
          listed_for_sale?: boolean
          quantity?: number
          sale_price_ae?: number | null
          user_id: string
        }
        Update: {
          acquired_at?: string
          acquired_via?: string | null
          den_slot?: string | null
          equipped?: boolean
          id?: string
          item_id?: string
          listed_for_sale?: boolean
          quantity?: number
          sale_price_ae?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
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
      wellbeing_outreach: {
        Row: {
          anon_user_hash: string | null
          contacted_at: string
          created_at: string
          id: string
          mood_entry_id: string | null
        }
        Insert: {
          anon_user_hash?: string | null
          contacted_at?: string
          created_at?: string
          id?: string
          mood_entry_id?: string | null
        }
        Update: {
          anon_user_hash?: string | null
          contacted_at?: string
          created_at?: string
          id?: string
          mood_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wellbeing_outreach_mood_entry_id_fkey"
            columns: ["mood_entry_id"]
            isOneToOne: false
            referencedRelation: "mood_entries"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_event_qr: {
        Args: { p_token: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "researcher" | "user"
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
      app_role: ["admin", "moderator", "researcher", "user"],
    },
  },
} as const
