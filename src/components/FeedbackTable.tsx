import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Calendar, Star, MapPin, User, Download, Trash2, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { useFeedback } from '@/hooks/useFeedback';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';

interface FeedbackTableProps {
  searchTerm: string;
  statusFilter: string;
  serviceFilter: string;
  dateFromFilter?: string;
  dateToFilter?: string;
}

const FeedbackTable = ({ searchTerm, statusFilter, serviceFilter, dateFromFilter, dateToFilter }: FeedbackTableProps) => {
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { feedback, updateFeedback, deleteFeedback, isLoading } = useFeedback({
    search: searchTerm,
    status: statusFilter,
    service: serviceFilter,
    dateFrom: dateFromFilter,
    dateTo: dateToFilter
  });

  // Pagination logic
  const totalRecords = feedback.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = feedback.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteFeedback = async (feedbackId: string, customerName: string) => {
    try {
      deleteFeedback(feedbackId);
      // Force immediate refresh of all queries
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['feedback'] });
        queryClient.invalidateQueries({ queryKey: ['feedback-metrics'] });
        queryClient.refetchQueries({ queryKey: ['feedback'] });
        queryClient.refetchQueries({ queryKey: ['feedback-metrics'] });
      }, 100);
      
      toast({
        title: "Feedback Deleted",
        description: `Feedback from ${customerName} has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">New</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">Resolved</Badge>;
      case 'escalated':
        return <Badge className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full">Escalated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">Positive</Badge>;
      case 'negative':
        return <Badge className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full">Negative</Badge>;
      case 'neutral':
        return <Badge className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full">Negative</Badge>;
      default:
        return <Badge variant="outline">{sentiment}</Badge>;
    }
  };

  const getRatingStars = (rating: number) => {
    if (rating === 0) {
      return (
        <div className="flex items-center">
          <span className="text-gray-500">No Rating</span>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} 
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const updateStatus = (feedbackId: string, newStatus: string) => {
    updateFeedback({ id: feedbackId, updates: { status: newStatus as any } });
    // Force refresh after status update
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ['feedback-metrics'] });
    }, 100);
  };

  const downloadCSV = () => {
    const headers = [
      'Date', 'ID', 'Customer ID', 'Customer Name', 'Phone', 'Email', 'Service Type', 
      'Review Text', 'Rating', 'Sentiment', 'Status', 'Location', 'Bank Contact'
    ];

    const csvData = feedback.map(item => [
      new Date(item.created_at).toLocaleDateString(),
      item.id,
      item.customer_id || '',
      item.customer_name,
      item.customer_phone || '',
      item.customer_email || '',
      item.service_type,
      `"${item.review_text.replace(/"/g, '""')}"`,
      item.review_rating,
      item.sentiment,
      item.status,
      item.issue_location || '',
      item.contacted_bank_person || ''
    ]);

    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${feedback.length} feedback records to CSV.`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading feedback data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(endIndex, totalRecords)} of {totalRecords} feedback records
        </div>
        <Button 
          onClick={downloadCSV} 
          variant="outline" 
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white border-none"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Date</TableHead>
              <TableHead className="font-semibold text-gray-700">Customer</TableHead>
              <TableHead className="font-semibold text-gray-700">Service</TableHead>
              <TableHead className="font-semibold text-gray-700">Rating</TableHead>
              <TableHead className="font-semibold text-gray-700">Sentiment</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRecords.map((feedbackItem) => (
              <TableRow 
                key={feedbackItem.id}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{new Date(feedbackItem.created_at).toLocaleDateString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">{feedbackItem.customer_name}</div>
                    <div className="text-sm text-gray-500">
                      {feedbackItem.customer_id && `ID: ${feedbackItem.customer_id}`}
                      {feedbackItem.issue_location && ` • ${feedbackItem.issue_location}`}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    {feedbackItem.service_type}
                  </Badge>
                </TableCell>
                <TableCell>{getRatingStars(feedbackItem.review_rating)}</TableCell>
                <TableCell>
                  {getSentimentBadge(feedbackItem.review_rating >= 4 ? 'positive' : feedbackItem.review_rating <= 2 ? 'negative' : 'neutral')}
                </TableCell>
                <TableCell>
                  <Select 
                    value={feedbackItem.status} 
                    onValueChange={(value) => updateStatus(feedbackItem.id, value)}
                  >
                    <SelectTrigger className="w-32 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            console.log('Selected Feedback:', feedbackItem);
                            setSelectedFeedback(feedbackItem);
                          }}
                          className="border-gray-200 hover:bg-gray-50 text-gray-700"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-semibold">Feedback Details</DialogTitle>
                          <DialogDescription className="text-gray-500">
                            Complete feedback information and detected issues
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedFeedback && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900">{selectedFeedback.customer_name}</span>
                                {selectedFeedback.customer_id && (
                                  <Badge variant="outline" className="bg-gray-50">ID: {selectedFeedback.customer_id}</Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{new Date(selectedFeedback.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{selectedFeedback.issue_location || 'Not specified'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Star className="w-4 h-4 text-gray-400" />
                                {getRatingStars(selectedFeedback.review_rating)}
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                              <div className="space-y-2 text-sm text-gray-600">
                                <p>Phone: {selectedFeedback.customer_phone || 'N/A'}</p>
                                <p>Email: {selectedFeedback.customer_email || 'N/A'}</p>
                                <p>Bank Contact: {selectedFeedback.contacted_bank_person || 'N/A'}</p>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Review Text</h4>
                              <p className="text-sm bg-gray-50 p-4 rounded-lg text-gray-600">{selectedFeedback.review_text}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Sentiment</h4>
                                {getSentimentBadge(selectedFeedback.review_rating >= 4 ? 'positive' : selectedFeedback.review_rating <= 2 ? 'negative' : 'neutral')}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
                                {getStatusBadge(selectedFeedback.status)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Service</h4>
                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                  {selectedFeedback.service_type}
                                </Badge>
                              </div>
                            </div>                            
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Detected Issues</h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedFeedback.detected_issues?.title ? (
                                  selectedFeedback.detected_issues.title.split(',').map((title, index) => (
                                    <Badge
                                      key={`issue-${index}`}
                                      variant="outline"
                                      className="bg-red-50 text-red-700 border-red-200"
                                    >
                                      {title.trim()}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-gray-500">No issues detected yet</span>
                                )}
                              </div>

                              <h4 className="font-semibold text-gray-900 mt-4 mb-2">Detected Positive Aspects</h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedFeedback.detected_positive_aspects?.title ? (
                                  selectedFeedback.detected_positive_aspects.title.split(',').map((aspect, index) => (
                                    <Badge
                                      key={`positive-${index}`}
                                      variant="outline"
                                      className="bg-green-50 text-green-700 border-green-200"
                                    >
                                      {aspect.trim()}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-gray-500">No positive aspects detected yet</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-gray-200 hover:bg-red-50 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-semibold">Delete Feedback</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-500">
                            Are you sure you want to delete the feedback from {feedbackItem.customer_name}? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-gray-200 hover:bg-gray-50">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteFeedback(feedbackItem.id, feedbackItem.customer_name)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      
      {feedback.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No feedback records found matching the current filters.</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackTable;
