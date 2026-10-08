export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          name: string;
          seat_number: number;
          is_host: boolean;
          avatar_url: string | null;
          initials: string;
          avatar_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          seat_number?: number;
          is_host?: boolean;
          avatar_url?: string | null;
          initials?: string;
          avatar_color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          seat_number?: number;
          is_host?: boolean;
          avatar_url?: string | null;
          initials?: string;
          avatar_color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          name: string;
          status: 'draft' | 'active' | 'completed';
          game_config: Json;
          current_round_number: number;
          started_at: string;
          completed_at: string | null;
          is_finalized: boolean;
          tea_settled: boolean;
          table_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          status?: 'draft' | 'active' | 'completed';
          game_config: Json;
          current_round_number?: number;
          started_at?: string;
          completed_at?: string | null;
          is_finalized?: boolean;
          tea_settled?: boolean;
          table_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: 'draft' | 'active' | 'completed';
          game_config?: Json;
          current_round_number?: number;
          started_at?: string;
          completed_at?: string | null;
          is_finalized?: boolean;
          tea_settled?: boolean;
          table_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      session_players: {
        Row: {
          session_id: string;
          player_id: string;
          seat_number: number;
          is_host: boolean | null;
          initials: string | null;
          avatar_color: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          session_id: string;
          player_id: string;
          seat_number?: number;
          is_host?: boolean | null;
          initials?: string | null;
          avatar_color?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          session_id?: string;
          player_id?: string;
          seat_number?: number;
          is_host?: boolean | null;
          initials?: string | null;
          avatar_color?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rounds: {
        Row: {
          id: string;
          session_id: string;
          round_number: number;
          multiplier: number;
          is_completed: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          session_id: string;
          round_number: number;
          multiplier?: number;
          is_completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          round_number?: number;
          multiplier?: number;
          is_completed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      round_scores: {
        Row: {
          id: string;
          round_id: string;
          session_id: string;
          player_id: string;
          base_score: number;
          multiplier: number;
          final_score: number;
          score_type: 'dick' | 'full' | 'custom';
          entered: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          round_id: string;
          session_id: string;
          player_id: string;
          base_score?: number;
          multiplier?: number;
          final_score?: number;
          score_type?: 'dick' | 'full' | 'custom';
          entered?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          session_id?: string;
          player_id?: string;
          base_score?: number;
          multiplier?: number;
          final_score?: number;
          score_type?: 'dick' | 'full' | 'custom';
          entered?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      session_results: {
        Row: {
          id: string;
          session_id: string;
          player_id: string;
          player_name: string;
          total_score: number;
          final_position: number;
          is_winner: boolean;
          is_runner_up: boolean;
          is_tea_duty: boolean;
          dick_hands_count: number;
          busts_count: number;
          created_at: string;
        };
        Insert: {
          id: string;
          session_id: string;
          player_id: string;
          player_name: string;
          total_score: number;
          final_position: number;
          is_winner?: boolean;
          is_runner_up?: boolean;
          is_tea_duty?: boolean;
          dick_hands_count?: number;
          busts_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          player_id?: string;
          player_name?: string;
          total_score?: number;
          final_position?: number;
          is_winner?: boolean;
          is_runner_up?: boolean;
          is_tea_duty?: boolean;
          dick_hands_count?: number;
          busts_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      player_stats: {
        Row: {
          player_id: string;
          player_name: string;
          sessions_played: number;
          wins: number;
          runner_ups: number;
          tea_bought: number;
          average_score: number;
          best_score: number;
          worst_score: number;
          win_ratio: number;
          recent_results: Json;
          updated_at: string;
        };
        Insert: {
          player_id: string;
          player_name: string;
          sessions_played?: number;
          wins?: number;
          runner_ups?: number;
          tea_bought?: number;
          average_score?: number;
          best_score?: number;
          worst_score?: number;
          win_ratio?: number;
          recent_results?: Json;
          updated_at?: string;
        };
        Update: {
          player_id?: string;
          player_name?: string;
          sessions_played?: number;
          wins?: number;
          runner_ups?: number;
          tea_bought?: number;
          average_score?: number;
          best_score?: number;
          worst_score?: number;
          win_ratio?: number;
          recent_results?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      game_photos: {
        Row: {
          id: string;
          session_id: string;
          game_name: string;
          session_name: string;
          storage_path: string;
          thumbnail_url: string | null;
          caption: string;
          sub_caption: string | null;
          tag: string | null;
          badge: string | null;
          player_initials: string[];
          likes: number;
          uploaded_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          id: string;
          session_id: string;
          game_name?: string;
          session_name?: string;
          storage_path: string;
          thumbnail_url?: string | null;
          caption?: string;
          sub_caption?: string | null;
          tag?: string | null;
          badge?: string | null;
          player_initials?: string[];
          likes?: number;
          uploaded_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          game_name?: string;
          session_name?: string;
          storage_path?: string;
          thumbnail_url?: string | null;
          caption?: string;
          sub_caption?: string | null;
          tag?: string | null;
          badge?: string | null;
          player_initials?: string[];
          likes?: number;
          uploaded_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
