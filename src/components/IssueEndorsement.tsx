import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertTriangle, LogOut, User, Loader2, TrendingUp, Users } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mysqlService } from '@/services/mysqlService';
import LoginForm from './LoginForm';
import IssueResolutionManager from './IssueResolutionManager';

interface IssueEndorsementProps {
  tab: 'pending' | 'approved' | 'rejected';
  onCountsUpdate: (counts: { pending: number; approved: number; rejected: number }) => void;
}

const IssueEndorsement: React.FC<IssueEndorsementProps> = ({ tab, onCountsUpdate }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch approved issues with resolution field
  const { data: approvedIssues = [], isLoading: loadingApproved, error: approvedError } = useQuery({
    queryKey: ['approved-issues'],
    queryFn: async () => {
      try {
        const response = await fetch(`${mysqlService.apiBaseUrl}/approved-issues`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch approved issues: ${response.status}`);
        }
        
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error('Error fetching approved issues:', error);
        throw error;
      }
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  // Fetch rejected issues
  const { data: rejectedIssues = [], isLoading: loadingRejected, error: rejectedError } = useQuery({
    queryKey: ['rejected-issues'],
    queryFn: async () => {
      try {
        const response = await fetch(`${mysqlService.apiBaseUrl}/rejected-issues`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch rejected issues: ${response.status}`);
        }
        
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error('Error fetching rejected issues:', error);
        throw error;
      }
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  // Fetch pending issues to get the count
  const { data: pendingIssues = [], isLoading: loadingPending, error: pendingError } = useQuery({
    queryKey: ['pending-issues-count'],
    queryFn: async () => {
      try {
        const response = await fetch(`${mysqlService.apiBaseUrl}/pending-issues`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch pending issues: ${response.status}`);
        }
        
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error('Error fetching pending issues:', error);
        throw error;
      }
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  // Update counts whenever the data changes
  React.useEffect(() => {
    onCountsUpdate({
      pending: pendingIssues.length,
      approved: approvedIssues.length,
      rejected: rejectedIssues.length
    });
  }, [pendingIssues.length, approvedIssues.length, rejectedIssues.length, onCountsUpdate]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['pending-issues'] });
    queryClient.invalidateQueries({ queryKey: ['pending-issues-count'] });
    queryClient.invalidateQueries({ queryKey: ['approved-issues'] });
    queryClient.invalidateQueries({ queryKey: ['rejected-issues'] });
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden flex items-center justify-center py-16">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,_transparent_25%,_rgba(68,138,255,0.05)_25%,_rgba(68,138,255,0.05)_50%,_transparent_50%,_transparent_75%,_rgba(68,138,255,0.05)_75%)] bg-[length:20px_20px] pointer-events-none" />
        <div className="relative w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 z-10 items-center">
          {/* Left: Highlighted content (no Card) */}
          <div className="flex flex-col justify-center px-2 md:px-8">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent mb-3 drop-shadow-lg">
              Issue Detection & Endorsement
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6 drop-shadow-sm">
              Login to review, approve, or reject detected customer issues securely.
            </p>
            <ul className="space-y-4 mt-4 text-xl text-gray-900 dark:text-gray-100 font-medium text-left">
              <li className="flex items-center hover:translate-x-2 transition-transform duration-200">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" /> 
                <span>Approve or reject issues</span>
              </li>
              <li className="flex items-center hover:translate-x-2 transition-transform duration-200">
                <TrendingUp className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" /> 
                <span>Track issue status</span>
              </li>
              <li className="flex items-center hover:translate-x-2 transition-transform duration-200">
                <Users className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" /> 
                <span>Supervisor & admin access</span>
              </li>
              <li className="flex items-center hover:translate-x-2 transition-transform duration-200">
                <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0" /> 
                <span>Add resolution notes</span>
              </li>
            </ul>
          </div>
          {/* Right: Login Form */}
          <div className="flex items-center justify-center"><LoginForm /></div>
        </div>
      </div>
    );
  }

  // Show errors if any queries failed
  if (approvedError || rejectedError || pendingError) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-800 dark:text-red-300">
                  Error loading data. Please check your connection and try again.
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-5">
      {tab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-start space-x-3 mb-6">
            <Clock className="w-8 h-8 text-blue-600 mt-1" />
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Issues</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Review and take action on pending customer issues</p>
            </div>
          </div>
          {loadingPending ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading pending issues...</span>
            </div>
          ) : (
            <IssueResolutionManager />
          )}
        </div>
      )}

      {tab === 'approved' && (
        <div className="space-y-4">
          <div className="flex items-start space-x-3 mb-6">
            <CheckCircle className="w-8 h-8 text-green-600 mt-1" />
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Approved Issues</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">View all approved customer issues and their resolutions</p>
            </div>
          </div>
          {loadingApproved ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading approved issues...</span>
            </div>
          ) : approvedIssues.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8 text-gray-500">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No approved issues yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Approved issues will appear here after review</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            approvedIssues.map((issue) => (
              <Card key={issue.id} className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-[#1e293b] dark:to-[#0f172a] hover:shadow-xl transition-shadow duration-200">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-green-600"></div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                          {issue.category}
                        </Badge>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors duration-200">
                          Approved
                        </Badge>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                          {issue.feedback_count} feedback{issue.feedback_count !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">{issue.title}</CardTitle>
                        <CardDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>Approved by: {issue.approved_by}</span>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <Clock className="w-4 h-4" />
                            <span>{new Date(issue.approved_date).toLocaleDateString()}</span>
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">Issue Description</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{issue.description}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800/50 rounded-lg p-4 shadow-sm border border-green-100 dark:border-green-900/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">Resolution Plan</h4>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{issue.resolution}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'rejected' && (
        <div className="space-y-4">
          <div className="flex items-start space-x-3 mb-6">
            <XCircle className="w-8 h-8 text-red-600 mt-1" />
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rejected Issues</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">View all rejected customer issues and rejection reasons</p>
            </div>
          </div>
          {loadingRejected ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading rejected issues...</span>
            </div>
          ) : rejectedIssues.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8 text-gray-500">
                <div className="text-center">
                  <XCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No rejected issues</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Rejected issues will appear here after review</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            rejectedIssues.map((issue) => (
              <Card key={issue.id} className="border-l-4 border-l-red-500 bg-white dark:bg-[#1e293b] dark:border-l-red-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">{issue.category}</Badge>
                        <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                      </div>
                      <CardTitle>{issue.original_title}</CardTitle>
                      <CardDescription>
                        Rejected by: {issue.rejected_by} | Date: {new Date(issue.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Original Description:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{issue.original_description}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Rejection Reason:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 bg-red-50 dark:bg-[#2d1a1a] p-3 rounded border-l-4 border-l-red-400 dark:border-l-red-700">{issue.rejection_reason}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default IssueEndorsement;
