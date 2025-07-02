
import { supabase } from '@/integrations/supabase/client';
import { Issue } from './types';

// Issue operations
export const issueService = {
  async getAll(status?: string) {
    let query = supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(issue: Omit<Issue, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('issues')
      .insert([issue])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Issue>) {
    const { data, error } = await supabase
      .from('issues')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async approve(id: string, approvedBy: string, resolution?: string) {
    const updates: Partial<Issue> = {
      status: 'approved',
      approved_by: approvedBy,
      approved_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    if (resolution) {
      updates.resolution = resolution;
    }

    const { data, error } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async reject(id: string) {
    const { data, error } = await supabase
      .from('issues')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
