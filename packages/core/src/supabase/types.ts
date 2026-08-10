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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ingredient_clashes: {
        Row: {
          id: string
          ingredient_a: string
          ingredient_b: string
          reason: string
          severity: string | null
        }
        Insert: {
          id?: string
          ingredient_a: string
          ingredient_b: string
          reason: string
          severity?: string | null
        }
        Update: {
          id?: string
          ingredient_a?: string
          ingredient_b?: string
          reason?: string
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_clashes_ingredient_a_fkey"
            columns: ["ingredient_a"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_clashes_ingredient_b_fkey"
            columns: ["ingredient_b"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          common_name: string | null
          created_at: string
          description: string | null
          functions: string[] | null
          id: string
          inci_name: string
          safety_notes: string | null
          updated_at: string
        }
        Insert: {
          common_name?: string | null
          created_at?: string
          description?: string | null
          functions?: string[] | null
          id?: string
          inci_name: string
          safety_notes?: string | null
          updated_at?: string
        }
        Update: {
          common_name?: string | null
          created_at?: string
          description?: string | null
          functions?: string[] | null
          id?: string
          inci_name?: string
          safety_notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          position: number
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          position: number
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ratings: {
        Row: {
          created_at: string
          id: string
          product_id: string
          profile_id: string
          rating: number
          review: string | null
          skin_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          profile_id: string
          rating: number
          review?: string | null
          skin_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          profile_id?: string
          rating?: number
          review?: string | null
          skin_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ratings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ratings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          obf_id: string | null
          product_type: string | null
          raw_ingredients: string | null
          updated_at: string
        }
        Insert: {
          brand: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          obf_id?: string | null
          product_type?: string | null
          raw_ingredients?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          obf_id?: string | null
          product_type?: string | null
          raw_ingredients?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          aging_concern: string | null
          answers: Json | null
          avatar_url: string | null
          bio: string | null
          budget: string[] | null
          created_at: string
          current_routine: string[] | null
          display_name: string | null
          id: string
          medications: string[] | null
          pigmentation: string | null
          pregnancy_status: string | null
          reactions: string[] | null
          routine_complexity: string | null
          sensitivity: string | null
          skin_type: string | null
          sun_exposure: string | null
          sun_reaction: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          age_range?: string | null
          aging_concern?: string | null
          answers?: Json | null
          avatar_url?: string | null
          bio?: string | null
          budget?: string[] | null
          created_at?: string
          current_routine?: string[] | null
          display_name?: string | null
          id: string
          medications?: string[] | null
          pigmentation?: string | null
          pregnancy_status?: string | null
          reactions?: string[] | null
          routine_complexity?: string | null
          sensitivity?: string | null
          skin_type?: string | null
          sun_exposure?: string | null
          sun_reaction?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          age_range?: string | null
          aging_concern?: string | null
          answers?: Json | null
          avatar_url?: string | null
          bio?: string | null
          budget?: string[] | null
          created_at?: string
          current_routine?: string[] | null
          display_name?: string | null
          id?: string
          medications?: string[] | null
          pigmentation?: string | null
          pregnancy_status?: string | null
          reactions?: string[] | null
          routine_complexity?: string | null
          sensitivity?: string | null
          skin_type?: string | null
          sun_exposure?: string | null
          sun_reaction?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      routine_steps: {
        Row: {
          created_at: string
          id: string
          note: string | null
          product_id: string | null
          routine_id: string
          step_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          product_id?: string | null
          routine_id: string
          step_order: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          product_id?: string | null
          routine_id?: string
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_steps_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_steps_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "skincare_routines"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          created_at: string
          id: string
          profile_id: string | null
          query: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id?: string | null
          query: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string | null
          query?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skincare_routines: {
        Row: {
          created_at: string
          id: string
          name: string
          profile_id: string
          routine_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          profile_id: string
          routine_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          profile_id?: string
          routine_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skincare_routines_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          display_name: string | null
          skin_type: string | null
          username: string | null
        }
        Relationships: []
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
