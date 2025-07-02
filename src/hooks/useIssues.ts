
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issueService, Issue } from '@/services';
import { useToast } from '@/hooks/use-toast';

export const useIssues = (status?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: issues = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['issues', status],
    queryFn: () => issueService.getAll(status),
  });

  const createIssueMutation = useMutation({
    mutationFn: issueService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast({
        title: "Success",
        description: "Issue created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create issue",
        variant: "destructive",
      });
    },
  });

  const updateIssueMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Issue> }) =>
      issueService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast({
        title: "Success",
        description: "Issue updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update issue",
        variant: "destructive",
      });
    },
  });

  const approveIssueMutation = useMutation({
    mutationFn: ({ id, approvedBy, resolution }: { id: string; approvedBy: string; resolution?: string }) =>
      issueService.approve(id, approvedBy, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast({
        title: "Success",
        description: "Issue approved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve issue",
        variant: "destructive",
      });
    },
  });

  const rejectIssueMutation = useMutation({
    mutationFn: issueService.reject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast({
        title: "Success",
        description: "Issue rejected successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject issue",
        variant: "destructive",
      });
    },
  });

  return {
    issues,
    isLoading,
    error,
    createIssue: createIssueMutation.mutate,
    updateIssue: updateIssueMutation.mutate,
    approveIssue: approveIssueMutation.mutate,
    rejectIssue: rejectIssueMutation.mutate,
    isCreating: createIssueMutation.isPending,
    isUpdating: updateIssueMutation.isPending,
    isApproving: approveIssueMutation.isPending,
    isRejecting: rejectIssueMutation.isPending,
  };
};
