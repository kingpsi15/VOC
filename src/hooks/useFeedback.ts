
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mysqlService } from '@/services/mysqlService';

export const useFeedbackMetrics = (filters: any = {}) => {
  return useQuery({
    queryKey: ['mysql-feedback-metrics', filters],
    queryFn: async () => {
      console.log('useFeedbackMetrics using MySQL service with filters:', filters);
      
      const metrics = await mysqlService.getMetrics(filters);
      console.log('MySQL metrics:', metrics);
      
      return {
        total: metrics.total || 0,
        positive: metrics.positive || 0,
        negative: metrics.negative || 0,
        neutral: 0,
        resolved: metrics.resolved || 0,
        pending: metrics.pending || 0,
        escalated: 0,
        avgRating: metrics.avgRating || 0,
        trend: metrics.trend || 0,
        ratingDistribution: {},
        data: []
      };
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};

export const useFeedback = (filters: any = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mysql-feedback', filters],
    queryFn: () => mysqlService.getFeedback(filters),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation({
    mutationFn: (feedbackData: any) => mysqlService.createFeedback(feedbackData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mysql-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['mysql-feedback-metrics'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      mysqlService.updateFeedback(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mysql-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['mysql-feedback-metrics'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mysqlService.deleteFeedback(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mysql-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['mysql-feedback-metrics'] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    feedback: query.data || [],
    createFeedback: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateFeedback: updateMutation.mutate,
    deleteFeedback: deleteMutation.mutate,
  };
};
