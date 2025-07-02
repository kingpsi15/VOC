
import { useQuery } from '@tanstack/react-query';
import { mysqlService } from '@/services/mysqlService';

export const useAnalytics = (filters: any = {}) => {
  const queryOptions = {
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always' as const,
    refetchOnWindowFocus: true,
  };

  const { data: sentimentData, isLoading: sentimentLoading } = useQuery({
    queryKey: ['mysql-analytics', 'sentiment', filters],
    queryFn: () => mysqlService.getSentimentData(filters),
    ...queryOptions,
  });

  const { data: serviceData, isLoading: serviceLoading } = useQuery({
    queryKey: ['mysql-analytics', 'service', filters],
    queryFn: () => mysqlService.getServiceData(filters),
    ...queryOptions,
  });

  const { data: locationData, isLoading: locationLoading } = useQuery({
    queryKey: ['mysql-analytics', 'location', filters],
    queryFn: () => Promise.resolve([]), // MySQL service doesn't have location data yet
    ...queryOptions,
  });

  const { data: ratingData, isLoading: ratingLoading } = useQuery({
    queryKey: ['mysql-analytics', 'rating', filters],
    queryFn: () => Promise.resolve([]), // MySQL service doesn't have rating distribution yet
    ...queryOptions,
  });

  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ['mysql-analytics', 'timeline', filters],
    queryFn: () => Promise.resolve([]), // MySQL service doesn't have timeline data yet
    ...queryOptions,
  });

  const { data: issuesData, isLoading: issuesLoading } = useQuery({
    queryKey: ['mysql-analytics', 'issues', filters],
    queryFn: () => Promise.resolve([]), // MySQL service doesn't have issues data yet
    ...queryOptions,
  });

  return {
    sentimentData,
    serviceData,
    locationData,
    ratingData,
    timelineData,
    issuesData,
    isLoading: sentimentLoading || serviceLoading || locationLoading || 
               ratingLoading || timelineLoading || issuesLoading,
  };
};
