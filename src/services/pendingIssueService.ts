
import { supabase } from '@/integrations/supabase/client';
import { PendingIssue, PendingResolution, RejectedIssue } from './types';

export const pendingIssueService = {
  async getAll() {
    const { data, error } = await supabase
      .from('pending_issues')
      .select(`
        *,
        resolutions:pending_resolutions(*),
        feedback:detected_from_feedback_id(customer_name, review_text, service_type, issue_location, created_at)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(issue: Omit<PendingIssue, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('pending_issues')
      .insert([issue])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async createResolution(resolution: Omit<PendingResolution, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('pending_resolutions')
      .insert([resolution])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async approve(pendingIssueId: string, approvedBy: string, editedTitle?: string, editedDescription?: string, editedResolution?: string) {
    // Get the pending issue with its resolution
    const { data: pendingIssue, error: fetchError } = await supabase
      .from('pending_issues')
      .select('*, resolutions:pending_resolutions(*)')
      .eq('id', pendingIssueId)
      .single();
    
    if (fetchError) throw fetchError;
    if (!pendingIssue) throw new Error('Pending issue not found');

    // Create approved issue
    const { data: approvedIssue, error: issueError } = await supabase
      .from('issues')
      .insert([{
        title: editedTitle || pendingIssue.title,
        description: editedDescription || pendingIssue.description,
        category: pendingIssue.category,
        resolution: editedResolution || pendingIssue.resolutions[0]?.resolution_text || 'Resolution pending',
        status: 'approved',
        confidence_score: pendingIssue.confidence_score,
        feedback_count: pendingIssue.feedback_count,
        approved_by: approvedBy,
        approved_date: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (issueError) throw issueError;

    // Link to original feedback if exists
    if (pendingIssue.detected_from_feedback_id) {
      await supabase
        .from('feedback_issues')
        .insert([{
          feedback_id: pendingIssue.detected_from_feedback_id,
          issue_id: approvedIssue.id
        }]);
    }

    // Delete pending issue and resolutions (cascade will handle resolutions)
    await supabase
      .from('pending_issues')
      .delete()
      .eq('id', pendingIssueId);

    return approvedIssue;
  },

  async reject(pendingIssueId: string, rejectedBy: string, rejectionReason?: string) {
    // Get the pending issue
    const { data: pendingIssue, error: fetchError } = await supabase
      .from('pending_issues')
      .select('*')
      .eq('id', pendingIssueId)
      .single();
    
    if (fetchError) throw fetchError;
    if (!pendingIssue) throw new Error('Pending issue not found');

    // Create rejected issue record
    const { data: rejectedIssue, error: rejectError } = await supabase
      .from('rejected_issues')
      .insert([{
        original_title: pendingIssue.title,
        original_description: pendingIssue.description,
        category: pendingIssue.category,
        rejection_reason: rejectionReason,
        rejected_by: rejectedBy,
        original_pending_issue_id: pendingIssueId
      }])
      .select()
      .single();
    
    if (rejectError) throw rejectError;

    // Delete pending issue
    await supabase
      .from('pending_issues')
      .delete()
      .eq('id', pendingIssueId);

    return rejectedIssue;
  },

  async updateIssue(id: string, updates: Partial<PendingIssue>) {
    const { data, error } = await supabase
      .from('pending_issues')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateResolution(id: string, resolutionText: string) {
    const { data, error } = await supabase
      .from('pending_resolutions')
      .update({ resolution_text: resolutionText })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
