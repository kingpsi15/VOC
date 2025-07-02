
import { supabase } from '@/integrations/supabase/client';

export const analyticsService = {
  async getSentimentData(filters: any = {}) {
    // This service is deprecated - use mysqlService instead
    console.warn('analyticsService is deprecated - use mysqlService for MySQL data');
    return [];
  },

  async getServiceData(filters: any = {}) {
    // This service is deprecated - use mysqlService instead
    console.warn('analyticsService is deprecated - use mysqlService for MySQL data');
    return [];
  },

  async getLocationData(filters: any = {}) {
    // This service is deprecated - use mysqlService instead
    console.warn('analyticsService is deprecated - use mysqlService for MySQL data');
    return [];
  },

  async getRatingDistribution(filters: any = {}) {
    // This service is deprecated - use mysqlService instead
    console.warn('analyticsService is deprecated - use mysqlService for MySQL data');
    return [];
  },

  async getTimelineData(filters: any = {}) {
    // This service is deprecated - use mysqlService instead
    console.warn('analyticsService is deprecated - use mysqlService for MySQL data');
    return [];
  },

  async getTopIssues(filters: any = {}) {
    // This service is deprecated - use mysqlService instead
    console.warn('analyticsService is deprecated - use mysqlService for MySQL data');
    return [];
  }
};
