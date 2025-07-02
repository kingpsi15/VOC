import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Edit, Plus, Loader2, Lightbulb, AlertTriangle, Sparkles, User } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/contexts/AuthContext";
import { openaiService } from '@/services/openaiService';
import { mysqlService } from '@/services/mysqlService';

interface PendingIssueWithResolution {
  id: string;
  title: string;
  description: string;
  category: string;
  confidence_score: number;
  feedback_count: number;
  detected_from_feedback_id: string;
  created_at: string;
  pending_resolutions: {
    id: string;
    resolution_text: string;
    confidence_score: number;
  }[];
  feedback?: {
    customer_name: string;
    review_text: string;
    issue_location: string;
  };
}

interface ExistingIssue {
  id: string;
  title: string;
  category: string;
  description: string;
  feedback_count: number;
}

const IssueResolutionManager = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [editingIssue, setEditingIssue] = useState<string | null>(null);
  const [editingResolution, setEditingResolution] = useState<string | null>(null);
  const [editedIssueText, setEditedIssueText] = useState('');
  const [editedResolutionText, setEditedResolutionText] = useState('');
  const [selectedExistingIssue, setSelectedExistingIssue] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentIssue, setCurrentIssue] = useState<PendingIssueWithResolution | null>(null);
  const [resolutionCache, setResolutionCache] = useState<Record<string, { text: string, confidence: number }>>({});
  const [isGeneratingResolution, setIsGeneratingResolution] = useState<Record<string, boolean>>({});

  // Fetch pending issues from database
  const { data: pendingIssues = [], isLoading, error, refetch } = useQuery({
    queryKey: ['pending-issues'],
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
        return data as PendingIssueWithResolution[];
      } catch (error) {
        console.error('Error fetching pending issues:', error);
        throw error;
      }
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  // Fetch existing approved issues
  const { data: existingIssues = [] } = useQuery({
    queryKey: ['existing-issues'],
    queryFn: async () => {
      try {
        const response = await fetch(`${mysqlService.apiBaseUrl}/issues?status=approved`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch existing issues: ${response.status}`);
        }
        
        const data = await response.json();
        return data as ExistingIssue[];
      } catch (error) {
        console.error('Error fetching existing issues:', error);
        throw error;
      }
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  // Generate AI-based recommendation
  const generateResolution = async (issue: PendingIssueWithResolution): Promise<{ text: string, confidence: number }> => {
    try {
      setIsGeneratingResolution(prev => ({ ...prev, [issue.id]: true }));
      
      // First check if issue already has a resolution in the database
      if (issue.pending_resolutions && issue.pending_resolutions.length > 0) {
        console.log(`Using existing resolution from database for issue ${issue.id}`);
        const storedResolution = issue.pending_resolutions[0];
        setResolutionCache(prev => ({
          ...prev,
          [issue.id]: {
            text: storedResolution.resolution_text,
            confidence: storedResolution.confidence_score || 0.8
          }
        }));
        return {
          text: storedResolution.resolution_text,
          confidence: storedResolution.confidence_score || 0.8
        };
      }
      
      // No stored resolution, generate a new one with OpenAI
      console.log(`Generating new resolution with OpenAI for issue ${issue.id}`);
      const resolution = await openaiService.generateResolution({
        title: issue.title,
        description: issue.description,
        category: issue.category,
        feedback_text: issue.feedback?.review_text
      });
      
      // Cache the result
      setResolutionCache(prev => ({
        ...prev,
        [issue.id]: {
          text: resolution.resolution_text,
          confidence: resolution.confidence_score
        }
      }));
      
      // Store in database for future use
      try {
        const response = await fetch(`${mysqlService.apiBaseUrl}/pending-resolutions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pending_issue_id: issue.id,
            resolution_text: resolution.resolution_text,
            confidence_score: resolution.confidence_score
          }),
        });
        
        if (!response.ok) {
          console.error(`Error storing resolution in database: ${response.status}`);
        } else {
          console.log(`Stored new resolution in database for issue ${issue.id}`);
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
      }
      
      return {
        text: resolution.resolution_text,
        confidence: resolution.confidence_score
      };
    } catch (error) {
      console.error('Error generating AI resolution:', error);
      // Fall back to rule-based recommendation
      const fallbackText = generateFallbackRecommendation(issue);
      setResolutionCache(prev => ({
        ...prev,
        [issue.id]: {
          text: fallbackText,
          confidence: 0.7
        }
      }));
      return {
        text: fallbackText,
        confidence: 0.7
      };
    } finally {
      setIsGeneratingResolution(prev => ({ ...prev, [issue.id]: false }));
    }
  };

  // Generate fallback recommendation based on category and title (kept as backup)
  const generateFallbackRecommendation = (issue: PendingIssueWithResolution): string => {
    const category = issue.category?.toLowerCase();
    const title = issue.title?.toLowerCase();

    if (category?.includes('atm') || title?.includes('atm')) {
      return "Please check the ATM status and ensure it's operational. If the issue persists, contact the technical support team to inspect the machine. Consider placing an 'Out of Order' sign if necessary and direct customers to the nearest working ATM.";
    }
    
    if (category?.includes('online') || category?.includes('banking') || title?.includes('online')) {
      return "Please verify the customer's login credentials and check for any system maintenance windows. Guide the customer through clearing browser cache/cookies or trying a different browser. If the issue persists, escalate to the IT support team.";
    }
    
    if (category?.includes('core') || category?.includes('system')) {
      return "This appears to be a core banking system issue. Please check the system status dashboard and contact the technical operations team immediately. Document the error details and customer information for further investigation.";
    }
    
    if (title?.includes('wait') || title?.includes('queue') || title?.includes('time')) {
      return "Consider implementing a queue management system or adding more service counters during peak hours. Train staff on efficient customer service techniques and consider offering appointment-based services for complex transactions.";
    }
    
    if (title?.includes('staff') || title?.includes('service')) {
      return "Provide additional customer service training to staff members. Review and update service protocols. Consider implementing a customer feedback system and regular staff performance evaluations.";
    }

    return "Please review this issue with the appropriate department. Ensure proper documentation and follow standard escalation procedures. Contact the customer to acknowledge their concern and provide updates on resolution progress.";
  };

  // Pre-fetch resolutions for all issues on component mount or when issues change
  useEffect(() => {
    const fetchResolutionsForNewIssues = async () => {
      if (!pendingIssues || pendingIssues.length === 0) return;
      
      for (const issue of pendingIssues) {
        // Skip if issue already has a resolution or is already being generated
        if (resolutionCache[issue.id] || isGeneratingResolution[issue.id]) continue;
        
        // Skip if issue already has a resolution in the database
        if (issue.pending_resolutions && issue.pending_resolutions.length > 0) {
          setResolutionCache(prev => ({
            ...prev,
            [issue.id]: {
              text: issue.pending_resolutions[0].resolution_text,
              confidence: issue.pending_resolutions[0].confidence_score || 0.8
            }
          }));
          continue;
        }
        
        // Otherwise generate a new resolution
        generateResolution(issue);
      }
    };
    
    fetchResolutionsForNewIssues();
  }, [pendingIssues]);

  const getResolutionText = (issue: PendingIssueWithResolution): string => {
    // First check if there's a resolution in the database
    if (issue.pending_resolutions && issue.pending_resolutions.length > 0) {
      return issue.pending_resolutions[0].resolution_text;
    }
    
    // Then check if there's a cached resolution
    if (resolutionCache[issue.id]) {
      return resolutionCache[issue.id].text;
    }
    
    // Otherwise use fallback and trigger generation
    if (!isGeneratingResolution[issue.id]) {
      generateResolution(issue);
    }
    
    return "Generating AI recommendation...";
  };

  const getResolutionConfidence = (issue: PendingIssueWithResolution): number => {
    if (issue.pending_resolutions && issue.pending_resolutions.length > 0) {
      return issue.pending_resolutions[0].confidence_score || 0.8;
    }
    
    if (resolutionCache[issue.id]) {
      return resolutionCache[issue.id].confidence;
    }
    
    return 0.7; // Default confidence for generated recommendations
  };

  const handleAcceptAsNew = async (issue: PendingIssueWithResolution) => {
    try {
      const resolution = getResolutionText(issue);
      
      // Create new approved issue
      const response = await fetch(`${mysqlService.apiBaseUrl}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: issue.title,
          description: issue.description,
          category: issue.category,
          resolution: resolution,
          status: 'approved',
          confidence_score: issue.confidence_score || 0.8,
          feedback_count: issue.feedback_count || 1,
          approved_by: user?.name || 'System',
          approved_date: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error details:', errorData);
        throw new Error(`Failed to create new issue: ${response.status}`);
      }

      // Delete pending issue and its resolutions
      const deleteResponse = await fetch(`${mysqlService.apiBaseUrl}/pending-issues/${issue.id}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        console.error('Failed to delete pending issue:', await deleteResponse.json());
      }
      
      refetch();
      toast({
        title: "New Issue Created",
        description: `"${issue.title}" has been added to the master issues list with recommended resolution.`,
      });
    } catch (error) {
      console.error('Error accepting issue:', error);
      toast({
        title: "Error",
        description: "Failed to accept issue. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleMapToExisting = (issue: PendingIssueWithResolution) => {
    setCurrentIssue(issue);
    setIsDialogOpen(true);
  };

  const handleConfirmMapping = async () => {
    if (selectedExistingIssue && currentIssue) {
      try {
        const existingIssue = existingIssues.find(ei => ei.id === selectedExistingIssue);
        
        // Update existing issue feedback count by incrementing it
        const newFeedbackCount = (existingIssue?.feedback_count || 0) + 1;
        const response = await fetch(`${mysqlService.apiBaseUrl}/issues/${selectedExistingIssue}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            feedback_count: newFeedbackCount,
            updated_at: new Date().toISOString()
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update existing issue: ${response.status}`);
        }

        // Delete pending issue
        await fetch(`${mysqlService.apiBaseUrl}/pending-issues/${currentIssue.id}`, {
          method: 'DELETE',
        });
        
        refetch();
        toast({
          title: "Issue Mapped",
          description: `Feedback mapped to existing issue: "${existingIssue?.title}"`,
        });
        setIsDialogOpen(false);
        setSelectedExistingIssue('');
        setCurrentIssue(null);
      } catch (error) {
        console.error('Error mapping issue:', error);
        toast({
          title: "Error",
          description: "Failed to map issue. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleReject = async (issueId: string, issue: PendingIssueWithResolution) => {
    try {
      // Move to rejected issues table
      const response = await fetch(`${mysqlService.apiBaseUrl}/rejected-issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_title: issue.title,
          original_description: issue.description,
          category: issue.category,
          rejection_reason: 'Manually rejected by reviewer',
          rejected_by: user?.name || 'System',
          original_pending_issue_id: issueId
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create rejected issue: ${response.status}`);
      }

      // Delete pending issue
      await fetch(`${mysqlService.apiBaseUrl}/pending-issues/${issueId}`, {
        method: 'DELETE',
      });
      
      refetch();
      toast({
        title: "Issue Rejected",
        description: "The issue has been rejected and archived.",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error rejecting issue:', error);
      toast({
        title: "Error",
        description: "Failed to reject issue. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startEditIssue = (issueId: string, currentText: string) => {
    setEditingIssue(issueId);
    setEditedIssueText(currentText);
  };

  const startEditResolution = (issueId: string, currentText: string) => {
    setEditingResolution(issueId);
    setEditedResolutionText(currentText);
  };

  const saveIssueEdit = async (issueId: string) => {
    try {
      const response = await fetch(`${mysqlService.apiBaseUrl}/pending-issues/${issueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: editedIssueText, 
          updated_at: new Date().toISOString() 
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update issue: ${response.status}`);
      }

      refetch();
      toast({
        title: "Issue Updated",
        description: "The issue description has been updated.",
      });
      setEditingIssue(null);
      setEditedIssueText('');
    } catch (error) {
      console.error('Error updating issue:', error);
      toast({
        title: "Error",
        description: "Failed to update issue. Please try again.",
        variant: "destructive"
      });
    }
  };

  const saveResolutionEdit = async (issueId: string) => {
    try {
      const issue = pendingIssues.find(i => i.id === issueId);
      const resolutionId = issue?.pending_resolutions?.[0]?.id;

      if (resolutionId) {
        const response = await fetch(`${mysqlService.apiBaseUrl}/pending-resolutions/${resolutionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ resolution_text: editedResolutionText }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update resolution: ${response.status}`);
        }
      } else {
        // Create new resolution if none exists
        const response = await fetch(`${mysqlService.apiBaseUrl}/pending-resolutions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pending_issue_id: issueId,
            resolution_text: editedResolutionText,
            confidence_score: 0.8
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create new resolution: ${response.status}`);
        }
      }

      refetch();
      toast({
        title: "Resolution Updated",
        description: "The resolution has been updated.",
      });
      setEditingResolution(null);
      setEditedResolutionText('');
    } catch (error) {
      console.error('Error updating resolution:', error);
      toast({
        title: "Error",
        description: "Failed to update resolution. Please try again.",
        variant: "destructive"
      });
    }
  };

  const cancelEdit = () => {
    setEditingIssue(null);
    setEditingResolution(null);
    setEditedIssueText('');
    setEditedResolutionText('');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading pending issues...</span>
      </div>
    );
  }

  if (pendingIssues.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-gray-500">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No pending issues to review</p>
            <p className="text-sm">Issues will appear here when detected from customer feedback</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendingIssues.map((issue) => {
        const resolutionText = getResolutionText(issue);
        const resolutionConfidence = getResolutionConfidence(issue);
        const hasExistingResolution = issue.pending_resolutions && issue.pending_resolutions.length > 0;

        return (
          <Card key={issue.id} className="border-l-4 border-l-orange-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline">{issue.category}</Badge>
                    <Badge className={getConfidenceColor(issue.confidence_score || 0)}>
                      {Math.round((issue.confidence_score || 0) * 100)}% confidence
                    </Badge>
                    <Badge variant="secondary">
                      {issue.feedback_count} feedback{issue.feedback_count !== 1 ? 's' : ''}
                    </Badge>
                    {issue.feedback?.issue_location && (
                      <Badge variant="secondary">{issue.feedback.issue_location}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                    {editingIssue === issue.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editedIssueText}
                          onChange={(e) => setEditedIssueText(e.target.value)}
                          className="mt-2"
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => saveIssueEdit(issue.id)}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span>{issue.title}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditIssue(issue.id, issue.title)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {issue.feedback && (
                      <>
                        <strong>Customer:</strong> {issue.feedback.customer_name} | 
                        <strong> Detected:</strong> {new Date(issue.created_at).toLocaleDateString()}
                      </>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {issue.feedback?.review_text && (
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">Original Feedback</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-200 leading-relaxed">{issue.feedback.review_text}</p>
                </div>
              )}

              <div className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-lg p-4 shadow-sm border border-blue-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                      {hasExistingResolution ? 'AI-Generated Resolution' : 'Recommended Resolution'}
                    </h4>
                  </div>
                  {isGeneratingResolution[issue.id] ? (
                    <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-xs text-blue-700 dark:text-blue-200 font-medium">Generating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {resolutionCache[issue.id] && (
                        <Badge className="bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200 hover:bg-violet-200 dark:hover:bg-violet-800 transition-colors duration-200 flex items-center">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Generated
                        </Badge>
                      )}
                      <Badge 
                        className={`${getConfidenceColor(resolutionConfidence)} hover:opacity-90 transition-opacity duration-200`}
                        variant="outline"
                      >
                        {Math.round(resolutionConfidence * 100)}% confidence
                      </Badge>
                    </div>
                  )}
                </div>
                {editingResolution === issue.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editedResolutionText}
                      onChange={(e) => setEditedResolutionText(e.target.value)}
                      className="bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-800 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 rounded-lg transition-all duration-200 text-gray-800 dark:text-gray-100"
                      rows={4}
                    />
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => saveResolutionEdit(issue.id)}
                        className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                      >
                        Save Resolution
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={cancelEdit}
                        className="hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    {isGeneratingResolution[issue.id] ? (
                      <div className="bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 min-h-[100px] flex items-center justify-center">
                        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-200">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm font-medium">Generating AI recommendation...</span>
                        </div>
                      </div>
                    ) : (
                      <div className={`bg-white dark:bg-gray-900 border-2 rounded-lg p-4 transition-all duration-200 ${
                        resolutionCache[issue.id] 
                          ? 'border-violet-200 dark:border-violet-800 hover:border-violet-300 dark:hover:border-violet-700' 
                          : hasExistingResolution 
                            ? 'border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700'
                            : 'border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700'
                      }`}>
                        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{resolutionText}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100 dark:hover:bg-gray-900"
                          onClick={() => startEditResolution(issue.id, resolutionText)}
                          disabled={isGeneratingResolution[issue.id]}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  onClick={() => handleAcceptAsNew(issue)}
                  className="bg-green-600 hover:bg-green-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Accept as New Issue
                </Button>
                
                <Button
                  onClick={() => handleMapToExisting(issue)}
                  variant="outline"
                  className="flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Map to Existing Issue
                </Button>
                
                <Button
                  onClick={() => handleReject(issue.id, issue)}
                  variant="destructive"
                  className="flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Map to Existing Issue</DialogTitle>
            <DialogDescription>
              Select an existing issue to map this feedback to:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Select value={selectedExistingIssue} onValueChange={setSelectedExistingIssue}>
              <SelectTrigger>
                <SelectValue placeholder="Select an existing issue" />
              </SelectTrigger>
              <SelectContent>
                {existingIssues.map((issue) => (
                  <SelectItem key={issue.id} value={issue.id}>
                    <div>
                      <div className="font-medium">{issue.title}</div>
                      <div className="text-sm text-gray-500">{issue.category} - {issue.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmMapping}
              disabled={!selectedExistingIssue}
            >
              Confirm Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IssueResolutionManager;
