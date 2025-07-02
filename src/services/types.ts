
// Database types
export interface Feedback {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  service_type: 'ATM' | 'OnlineBanking' | 'CoreBanking';
  review_text: string;
  review_rating: number;
  issue_location?: string;
  contacted_bank_person?: string;
  status: 'new' | 'in_progress' | 'resolved' | 'escalated';
  sentiment: 'positive' | 'negative' | 'neutral';
  detected_issues: string[];
  positive_flag?: boolean;
  negative_flag?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  resolution: string;
  status: 'pending' | 'approved' | 'rejected';
  confidence_score?: number;
  feedback_count: number;
  approved_by?: string;
  approved_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PendingIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  confidence_score?: number;
  feedback_count: number;
  detected_from_feedback_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PendingResolution {
  id: string;
  pending_issue_id: string;
  resolution_text: string;
  confidence_score?: number;
  created_at: string;
}

export interface RejectedIssue {
  id: string;
  original_title: string;
  original_description: string;
  category: string;
  rejection_reason?: string;
  rejected_by?: string;
  rejected_at: string;
  original_pending_issue_id?: string;
}

export interface BankEmployee {
  id: string;
  employee_id: string;
  name: string;
  department?: string;
  branch_location?: string;
  role?: string;
  created_at: string;
}

export interface EmployeeFeedbackInteraction {
  id: string;
  employee_id: string;
  feedback_id: string;
  interaction_type: 'contacted' | 'resolved' | 'escalated';
  interaction_date: string;
  notes?: string;
}

export interface FeedbackIssue {
  id: string;
  feedback_id: string;
  issue_id: string;
  created_at: string;
}
