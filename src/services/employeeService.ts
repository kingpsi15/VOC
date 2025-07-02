import { supabase } from '@/integrations/supabase/client';
import { BankEmployee, EmployeeFeedbackInteraction } from './types';
import axios from 'axios';

export const employeeService = {
  async getAll() {
    const { data, error } = await supabase
      .from('bank_employees')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('bank_employees')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getInteractions(employeeId?: string) {
    let query = supabase
      .from('employee_feedback_interactions')
      .select(`
        *,
        feedback:feedback_id(*),
        employee:employee_id(*)
      `);
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }
    
    const { data, error } = await query.order('interaction_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createInteraction(interaction: Omit<EmployeeFeedbackInteraction, 'id' | 'interaction_date'>) {
    const { data, error } = await supabase
      .from('employee_feedback_interactions')
      .insert([interaction])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ✅ Rewritten version using your backend API
  async getEmployeeStats(filters: { dateRange?: string; employeeId?: string } = {}) {
    try {
      const response = await axios.get('http://localhost:3001/api/employee-performance', {
        params: filters,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching employee stats:', error);
      throw error;
    }
  }
};
