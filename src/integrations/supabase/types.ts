export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analytics_snapshots: {
        Row: {
          avg_rating: number | null
          created_at: string | null
          id: string
          location: string | null
          negative_count: number | null
          positive_count: number | null
          resolution_rate: number | null
          service_type: string | null
          snapshot_date: string
          total_feedback: number | null
        }
        Insert: {
          avg_rating?: number | null
          created_at?: string | null
          id?: string
          location?: string | null
          negative_count?: number | null
          positive_count?: number | null
          resolution_rate?: number | null
          service_type?: string | null
          snapshot_date: string
          total_feedback?: number | null
        }
        Update: {
          avg_rating?: number | null
          created_at?: string | null
          id?: string
          location?: string | null
          negative_count?: number | null
          positive_count?: number | null
          resolution_rate?: number | null
          service_type?: string | null
          snapshot_date?: string
          total_feedback?: number | null
        }
        Relationships: []
      }
      bank_employees: {
        Row: {
          branch_location: string | null
          created_at: string | null
          department: string | null
          employee_id: string
          id: string
          name: string
          role: string | null
        }
        Insert: {
          branch_location?: string | null
          created_at?: string | null
          department?: string | null
          employee_id: string
          id?: string
          name: string
          role?: string | null
        }
        Update: {
          branch_location?: string | null
          created_at?: string | null
          department?: string | null
          employee_id?: string
          id?: string
          name?: string
          role?: string | null
        }
        Relationships: []
      }
      customer_followups: {
        Row: {
          conducted_by: string | null
          created_at: string | null
          feedback_id: string
          followup_date: string | null
          followup_status: string | null
          followup_type: string
          id: string
          response_received: boolean | null
          response_text: string | null
        }
        Insert: {
          conducted_by?: string | null
          created_at?: string | null
          feedback_id: string
          followup_date?: string | null
          followup_status?: string | null
          followup_type: string
          id?: string
          response_received?: boolean | null
          response_text?: string | null
        }
        Update: {
          conducted_by?: string | null
          created_at?: string | null
          feedback_id?: string
          followup_date?: string | null
          followup_status?: string | null
          followup_type?: string
          id?: string
          response_received?: boolean | null
          response_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_followups_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "bank_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_followups_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_feedback_interactions: {
        Row: {
          employee_id: string | null
          feedback_id: string | null
          id: string
          interaction_date: string | null
          interaction_type: string | null
          notes: string | null
        }
        Insert: {
          employee_id?: string | null
          feedback_id?: string | null
          id?: string
          interaction_date?: string | null
          interaction_type?: string | null
          notes?: string | null
        }
        Update: {
          employee_id?: string | null
          feedback_id?: string | null
          id?: string
          interaction_date?: string | null
          interaction_type?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_feedback_interactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "bank_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_feedback_interactions_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          contacted_bank_person: string | null
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          detected_issues: string[] | null
          id: string
          issue_location: string | null
          negative_flag: boolean | null
          positive_flag: boolean | null
          review_rating: number
          review_text: string
          sentiment: string | null
          service_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contacted_bank_person?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          detected_issues?: string[] | null
          id?: string
          issue_location?: string | null
          negative_flag?: boolean | null
          positive_flag?: boolean | null
          review_rating: number
          review_text: string
          sentiment?: string | null
          service_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contacted_bank_person?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          detected_issues?: string[] | null
          id?: string
          issue_location?: string | null
          negative_flag?: boolean | null
          positive_flag?: boolean | null
          review_rating?: number
          review_text?: string
          sentiment?: string | null
          service_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feedback_escalations: {
        Row: {
          created_at: string | null
          escalated_from: string | null
          escalated_to: string | null
          escalation_notes: string | null
          escalation_reason: string
          feedback_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          escalated_from?: string | null
          escalated_to?: string | null
          escalation_notes?: string | null
          escalation_reason: string
          feedback_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          escalated_from?: string | null
          escalated_to?: string | null
          escalation_notes?: string | null
          escalation_reason?: string
          feedback_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_escalations_escalated_from_fkey"
            columns: ["escalated_from"]
            isOneToOne: false
            referencedRelation: "bank_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_escalations_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "bank_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_escalations_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_issues: {
        Row: {
          created_at: string | null
          feedback_id: string | null
          id: string
          issue_id: string | null
        }
        Insert: {
          created_at?: string | null
          feedback_id?: string | null
          id?: string
          issue_id?: string | null
        }
        Update: {
          created_at?: string | null
          feedback_id?: string | null
          id?: string
          issue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_issues_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_issues_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_resolutions: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          feedback_id: string
          id: string
          implementation_notes: string | null
          resolution_status: string | null
          resolution_text: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          feedback_id: string
          id?: string
          implementation_notes?: string | null
          resolution_status?: string | null
          resolution_text: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          feedback_id?: string
          id?: string
          implementation_notes?: string | null
          resolution_status?: string | null
          resolution_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_resolutions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "bank_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_resolutions_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          category: string
          confidence_score: number | null
          created_at: string | null
          description: string
          feedback_count: number | null
          id: string
          resolution: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          category: string
          confidence_score?: number | null
          created_at?: string | null
          description: string
          feedback_count?: number | null
          id?: string
          resolution: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          category?: string
          confidence_score?: number | null
          created_at?: string | null
          description?: string
          feedback_count?: number | null
          id?: string
          resolution?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pending_issues: {
        Row: {
          category: string
          confidence_score: number | null
          created_at: string | null
          description: string
          detected_from_feedback_id: string | null
          feedback_count: number | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          confidence_score?: number | null
          created_at?: string | null
          description: string
          detected_from_feedback_id?: string | null
          feedback_count?: number | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          confidence_score?: number | null
          created_at?: string | null
          description?: string
          detected_from_feedback_id?: string | null
          feedback_count?: number | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_issues_detected_from_feedback_id_fkey"
            columns: ["detected_from_feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_resolutions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          pending_issue_id: string | null
          resolution_text: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          pending_issue_id?: string | null
          resolution_text: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          pending_issue_id?: string | null
          resolution_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_resolutions_pending_issue_id_fkey"
            columns: ["pending_issue_id"]
            isOneToOne: false
            referencedRelation: "pending_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      rejected_issues: {
        Row: {
          category: string
          id: string
          original_description: string
          original_pending_issue_id: string | null
          original_title: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
        }
        Insert: {
          category: string
          id?: string
          original_description: string
          original_pending_issue_id?: string | null
          original_title: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
        }
        Update: {
          category?: string
          id?: string
          original_description?: string
          original_pending_issue_id?: string | null
          original_title?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
