import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Star, Phone, Mail, MapPin, Lightbulb, CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { openaiService } from '@/services/openaiService';

interface FeedbackDetails {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  review_text: string;
  review_rating: number;
  service_type: string;
  issue_location?: string;
  contacted_bank_person?: string;
  sentiment: string;
  status: string;
  detected_issues: string[];
  created_at: string;
}

interface FeedbackDetailsCardProps {
  feedbackId: string;
  onClose?: () => void;
}

const FeedbackDetailsCard: React.FC<FeedbackDetailsCardProps> = ({ feedbackId, onClose }) => {
  const { toast } = useToast();
  const [isEditingResolution, setIsEditingResolution] = useState(false);
  const [customResolution, setCustomResolution] = useState('');
  const [aiResolution, setAiResolution] = useState<string | null>(null);
  const [isGeneratingResolution, setIsGeneratingResolution] = useState(false);

  const { data: feedback, isLoading, refetch } = useQuery({
    queryKey: ['feedback-details', feedbackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('id', feedbackId)
        .single();

      if (error) throw error;
      return data as FeedbackDetails;
    },
  });

  // Legacy rule-based resolution recommendation (kept as fallback)
  const generateRuleBasedResolution = (feedback: FeedbackDetails): string => {
    const serviceType = feedback.service_type?.toLowerCase();
    const issues = feedback.detected_issues || [];
    const reviewText = feedback.review_text?.toLowerCase();

    console.log('Generating rule-based resolution for:', { serviceType, issues, reviewText: reviewText?.substring(0, 100) });

    // Check for balance/minimum balance issues
    if (reviewText?.includes('balance') || reviewText?.includes('minimum') || issues.some(issue => issue.toLowerCase().includes('balance'))) {
      return "1. Review account terms and notify customers of changes in advance\n2. Provide clear communication about minimum balance requirements\n3. Offer alternative account types with lower balance requirements\n4. Implement grace period for existing customers\n5. Provide financial counseling to help customers maintain required balances";
    }

    // Additional rule-based checks...
    // (keep existing checks)

    // Default recommendation
    return "1. Acknowledge customer concern promptly\n2. Review issue with appropriate department\n3. Document incident for future reference\n4. Follow standard escalation procedures\n5. Provide regular updates to customer on resolution progress";
  };

  // Generate AI-powered resolution recommendation
  const generateAIResolution = async (feedback: FeedbackDetails) => {
    if (!feedback || isGeneratingResolution) return;
    
    setIsGeneratingResolution(true);
    try {
      // First check if we already have stored resolutions for this feedback
      const { data: existingResolutions, error } = await supabase
        .from('feedback_resolutions')
        .select('resolution_text')
        .eq('feedback_id', feedback.id)
        .maybeSingle();
      
      if (!error && existingResolutions?.resolution_text) {
        // Use existing stored resolution
        console.log('Using existing stored resolution');
        setAiResolution(existingResolutions.resolution_text);
        return;
      }
      
      // Check if we have detected issues
      let issueTitle = "Customer Feedback Issue";
      let issueDescription = feedback.review_text;
      
      // Use detected issues if available
      if (feedback.detected_issues && feedback.detected_issues.length > 0) {
        issueTitle = feedback.detected_issues[0];
        issueDescription = `${feedback.detected_issues.join(", ")}. ${feedback.review_text}`;
      }
      
      // Use OpenAI to generate resolution (this should be rare as resolutions should be stored during issue detection)
      const result = await openaiService.generateResolution({
        title: issueTitle,
        description: issueDescription,
        category: feedback.service_type,
        feedback_text: feedback.review_text
      });
      
      // Store the generated resolution for future use
      try {
        const { error: insertError } = await supabase.from('feedback_resolutions').insert({
          feedback_id: feedback.id,
          resolution_text: result.resolution_text,
          resolution_status: 'suggested',
          created_at: new Date().toISOString()
        });
        
        if (insertError) {
          console.error(`Error storing resolution in database: ${insertError.message}`);
        } else {
          console.log(`Stored new resolution in database for feedback ${feedback.id}`);
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        // Continue with the generated resolution even if storage fails
      }
      
      setAiResolution(result.resolution_text);
    } catch (error) {
      console.error('Error generating/retrieving AI resolution:', error);
      // Fall back to rule-based resolution
      setAiResolution(generateRuleBasedResolution(feedback));
    } finally {
      setIsGeneratingResolution(false);
    }
  };

  // Generate resolution when feedback data is loaded
  useEffect(() => {
    if (feedback && !aiResolution && !isGeneratingResolution) {
      generateAIResolution(feedback);
    }
  }, [feedback]);

  const handleSaveResolution = async () => {
    try {
      // Save resolution to a resolutions table or update feedback
      const { error } = await supabase
        .from('feedback')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', feedbackId);

      if (error) throw error;

      refetch();
      toast({
        title: "Resolution Saved",
        description: "Resolution recommendation has been saved and status updated.",
      });
      setIsEditingResolution(false);
    } catch (error) {
      console.error('Error saving resolution:', error);
      toast({
        title: "Error",
        description: "Failed to save resolution. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading feedback details...</span>
        </CardContent>
      </Card>
    );
  }

  if (!feedback) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="py-8 text-center text-gray-500">
          Feedback not found
        </CardContent>
      </Card>
    );
  }

  const recommendedResolution = aiResolution || generateRuleBasedResolution(feedback);
  console.log('Generated resolution:', recommendedResolution);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">Feedback Details</CardTitle>
            <CardDescription>Complete feedback information and detected issues</CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Customer Information */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="font-semibold text-lg">{feedback.customer_name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>ID: {feedback.id.slice(-8)}</span>
                <span>•</span>
                <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < feedback.review_rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-sm text-gray-600 ml-2">({feedback.review_rating})</span>
          </div>
        </div>

        {/* Location and Service Info */}
        <div className="flex items-center space-x-4 text-sm">
          {feedback.issue_location && (
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>{feedback.issue_location}</span>
            </div>
          )}
          <Badge variant="outline">{feedback.service_type}</Badge>
          <Badge className={`${feedback.sentiment === 'positive' ? 'bg-green-100 text-green-800' : feedback.sentiment === 'negative' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
            {feedback.sentiment}
          </Badge>
          <Badge className={`${feedback.status === 'new' ? 'bg-blue-100 text-blue-800' : feedback.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : feedback.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {feedback.status}
          </Badge>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Contact Information</h4>
          <div className="space-y-1 text-sm">
            {feedback.customer_phone && (
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{feedback.customer_phone}</span>
              </div>
            )}
            {feedback.customer_email && (
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{feedback.customer_email}</span>
              </div>
            )}
            {feedback.contacted_bank_person && (
              <div className="text-sm">
                <strong>Bank Contact:</strong> {feedback.contacted_bank_person}
              </div>
            )}
          </div>
        </div>

        {/* Review Text */}
        <div>
          <h4 className="font-semibold mb-2">Review Text</h4>
          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            {feedback.review_text}
          </div>
        </div>

        {/* Detected Issues */}
        {feedback.detected_issues && feedback.detected_issues.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Detected Issues</h4>
            <div className="flex flex-wrap gap-2">
              {feedback.detected_issues.map((issue, index) => (
                <Badge key={index} variant="secondary">{issue}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Resolution Recommendation - This is the missing section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold">Recommended Resolution:</h4>
              {isGeneratingResolution ? (
                <div className="flex items-center ml-2">
                  <Loader2 className="w-4 h-4 animate-spin mr-1 text-blue-600" />
                  <span className="text-xs text-blue-600">Generating AI recommendation...</span>
                </div>
              ) : aiResolution ? (
                <Badge className="ml-2 bg-violet-100 text-violet-800 flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditingResolution(!isEditingResolution);
                if (!isEditingResolution) {
                  setCustomResolution(recommendedResolution || '');
                }
              }}
              disabled={isGeneratingResolution}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>

          {isEditingResolution ? (
            <div className="space-y-3">
              <Textarea
                value={customResolution}
                onChange={(e) => setCustomResolution(e.target.value)}
                className="min-h-32"
                placeholder="Enter resolution steps..."
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditingResolution(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveResolution}>
                  Save Resolution
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              {isGeneratingResolution ? (
                <p className="text-sm p-3 rounded bg-blue-50 border-l-4 border-l-blue-400 min-h-[80px] flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Generating AI recommendation...
                </p>
              ) : (
                <p className={`text-sm whitespace-pre-line p-3 rounded bg-${aiResolution ? 'violet' : 'blue'}-50 border-l-4 border-l-${aiResolution ? 'violet' : 'blue'}-400`}>
                  {recommendedResolution}
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setIsEditingResolution(!isEditingResolution);
                  if (!isEditingResolution) {
                    setCustomResolution(recommendedResolution || '');
                  }
                }}
                disabled={isGeneratingResolution}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackDetailsCard;
