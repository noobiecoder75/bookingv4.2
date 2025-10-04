export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          company_name: string | null
          role: 'admin' | 'agent' | 'client' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          company_name?: string | null
          role?: 'admin' | 'agent' | 'client' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          company_name?: string | null
          role?: 'admin' | 'agent' | 'client' | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          quote_id: string | null
          booking_reference: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          total_amount: number
          currency: string
          booking_data: Json
          payment_status: 'pending' | 'partial' | 'paid' | 'refunded'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quote_id?: string | null
          booking_reference: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          total_amount: number
          currency?: string
          booking_data: Json
          payment_status?: 'pending' | 'partial' | 'paid' | 'refunded'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quote_id?: string | null
          booking_reference?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          total_amount?: number
          currency?: string
          booking_data?: Json
          payment_status?: 'pending' | 'partial' | 'paid' | 'refunded'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          quote_number: string
          title: string
          status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          total_amount: number
          currency: string
          items: Json
          valid_until: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          quote_number: string
          title: string
          status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          total_amount: number
          currency?: string
          items: Json
          valid_until?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          quote_number?: string
          title?: string
          status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          total_amount?: number
          currency?: string
          items?: Json
          valid_until?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hotels: {
        Row: {
          id: string
          hotel_code: string
          name: string
          location: Json
          rating: number | null
          amenities: Json | null
          images: Json | null
          description: string | null
          cached_rates: Json | null
          last_fetched: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hotel_code: string
          name: string
          location: Json
          rating?: number | null
          amenities?: Json | null
          images?: Json | null
          description?: string | null
          cached_rates?: Json | null
          last_fetched?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hotel_code?: string
          name?: string
          location?: Json
          rating?: number | null
          amenities?: Json | null
          images?: Json | null
          description?: string | null
          cached_rates?: Json | null
          last_fetched?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      flights: {
        Row: {
          id: string
          flight_number: string
          airline: string
          departure_airport: string
          arrival_airport: string
          departure_time: string
          arrival_time: string
          price_data: Json | null
          cached_availability: Json | null
          last_fetched: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          flight_number: string
          airline: string
          departure_airport: string
          arrival_airport: string
          departure_time: string
          arrival_time: string
          price_data?: Json | null
          cached_availability?: Json | null
          last_fetched?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          flight_number?: string
          airline?: string
          departure_airport?: string
          arrival_airport?: string
          departure_time?: string
          arrival_time?: string
          price_data?: Json | null
          cached_availability?: Json | null
          last_fetched?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          user_id: string
          amount: number
          currency: string
          payment_method: string
          payment_date: string
          stripe_payment_intent_id: string | null
          status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded'
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          user_id: string
          amount: number
          currency?: string
          payment_method: string
          payment_date?: string
          stripe_payment_intent_id?: string | null
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          user_id?: string
          amount?: number
          currency?: string
          payment_method?: string
          payment_date?: string
          stripe_payment_intent_id?: string | null
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      commissions: {
        Row: {
          id: string
          user_id: string
          booking_id: string
          amount: number
          currency: string
          rate: number
          status: 'pending' | 'approved' | 'paid' | 'cancelled'
          paid_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          booking_id: string
          amount: number
          currency?: string
          rate: number
          status?: 'pending' | 'approved' | 'paid' | 'cancelled'
          paid_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          booking_id?: string
          amount?: number
          currency?: string
          rate?: number
          status?: 'pending' | 'approved' | 'paid' | 'cancelled'
          paid_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          booking_id: string | null
          title: string
          description: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          due_date: string | null
          completed_at: string | null
          attachments: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          booking_id?: string | null
          title: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          due_date?: string | null
          completed_at?: string | null
          attachments?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          booking_id?: string | null
          title?: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          due_date?: string | null
          completed_at?: string | null
          attachments?: Json | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}