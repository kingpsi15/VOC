
// Main export file for all database services - MySQL only
export { supabase } from '@/integrations/supabase/client';
export type { 
  Feedback, 
  Issue, 
  PendingIssue, 
  PendingResolution, 
  RejectedIssue, 
  BankEmployee, 
  EmployeeFeedbackInteraction,
  FeedbackIssue 
} from './types';
export { mysqlService } from './mysqlService';

// Deprecated services - use mysqlService instead
export { feedbackService } from './feedbackService';
export { issueService } from './issueService';
export { analyticsService } from './analyticsService';
export { employeeService } from './employeeService';
export { pendingIssueService } from './pendingIssueService';
