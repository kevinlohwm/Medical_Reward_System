export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone_number: string | null
          points_balance: number
          role: 'customer' | 'staff' | 'admin'
          clinic_id: string | null
          two_factor_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          phone_number?: string | null
          points_balance?: number
          role?: 'customer' | 'staff' | 'admin'
          clinic_id?: string | null
          two_factor_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone_number?: string | null
          points_balance?: number
          role?: 'customer' | 'staff' | 'admin'
          clinic_id?: string | null
          two_factor_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      clinics: {
        Row: {
          id: string
          name: string
          type: 'aesthetic' | 'medical' | 'dental'
          address: string
          phone: string
          email: string
          operating_hours: string
          services: string[]
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'aesthetic' | 'medical' | 'dental'
          address: string
          phone: string
          email: string
          operating_hours: string
          services: string[]
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'aesthetic' | 'medical' | 'dental'
          address?: string
          phone?: string
          email?: string
          operating_hours?: string
          services?: string[]
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          clinic_id: string
          bill_amount: number
          points_earned: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          clinic_id: string
          bill_amount: number
          points_earned: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          clinic_id?: string
          bill_amount?: number
          points_earned?: number
          created_at?: string
        }
      }
      redemptions: {
        Row: {
          id: string
          user_id: string
          clinic_id: string
          points_redeemed: number
          cash_value_offset: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          clinic_id: string
          points_redeemed: number
          cash_value_offset: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          clinic_id?: string
          points_redeemed?: number
          cash_value_offset?: number
          created_at?: string
        }
      }
      promotions: {
        Row: {
          id: string
          title: string
          description: string
          start_date: string
          end_date: string
          target_segment_criteria: Record<string, any>
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          start_date: string
          end_date: string
          target_segment_criteria: Record<string, any>
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          start_date?: string
          end_date?: string
          target_segment_criteria?: Record<string, any>
          is_active?: boolean
          created_at?: string
        }
      }
      system_config: {
        Row: {
          id: string
          points_per_dollar: number
          points_per_dollar_value: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          points_per_dollar?: number
          points_per_dollar_value?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          points_per_dollar?: number
          points_per_dollar_value?: number
          created_at?: string
          updated_at?: string
        }
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
  }
}