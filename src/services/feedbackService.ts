
import { supabase } from '@/integrations/supabase/client';

export const feedbackService = {
  async getAll(filters: any = {}) {
    // This service is deprecated - use mysqlService instead
    console.warn('feedbackService is deprecated - use mysqlService for MySQL data');
    return [];
  },

  async getMetrics(filters: any = {}) {
    // This service is deprecated - use mysqlService instead
    console.warn('feedbackService is deprecated - use mysqlService for MySQL data');
    return {
      total: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      resolved: 0,
      pending: 0,
      escalated: 0,
      avgRating: 0,
      trend: 0,
      ratingDistribution: {},
      data: []
    };
  },

  async create(feedback: any) {
    console.warn('feedbackService is deprecated - use mysqlService for MySQL data');
    throw new Error('Use mysqlService instead');
  },

  async update(id: string, updates: any) {
    console.warn('feedbackService is deprecated - use mysqlService for MySQL data');
    throw new Error('Use mysqlService instead');
  },

  async delete(id: string) {
    console.warn('feedbackService is deprecated - use mysqlService for MySQL data');
    throw new Error('Use mysqlService instead');
  }
};
