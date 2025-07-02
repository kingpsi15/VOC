import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Calendar, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useFeedback } from '@/hooks/useFeedback';
import FeedbackTable from '@/components/FeedbackTable';
import BulkUpload from '@/components/BulkUpload';

const FeedbackManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const { toast } = useToast();
  const { createFeedback, isCreating } = useFeedback();

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    serviceType: '',
    reviewText: '',
    reviewRating: '',
    issueLocation: '',
    contactedBankPerson: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.customerName || !formData.reviewText || !formData.reviewRating || !formData.serviceType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const feedbackData = {
        customer_id: formData.customerId || null,
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone || null,
        customer_email: formData.customerEmail || null,
        service_type: formData.serviceType as 'ATM' | 'OnlineBanking' | 'CoreBanking',
        review_text: formData.reviewText,
        review_rating: parseInt(formData.reviewRating),
        issue_location: formData.issueLocation || null,
        contacted_bank_person: formData.contactedBankPerson || null,
        status: 'new' as const,
        sentiment: 'neutral' as const,  // You can change this logic if needed
        detected_issues: []
      };

      await createFeedback(feedbackData);

      setFormData({
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        serviceType: '',
        reviewText: '',
        reviewRating: '',
        issueLocation: '',
        contactedBankPerson: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating feedback:', error);
      toast({
        title: "Submission Failed",
        description: "Unable to save feedback. Please try again.",
        variant: "destructive"
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setServiceFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
  };

  return (
    <div className="space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header with Actions */}
      <Card className="border-none shadow-lg bg-white dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg dark:from-blue-900 dark:to-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold dark:text-white">Customer Feedback Management</CardTitle>
              <CardDescription className="text-blue-100 dark:text-blue-200 mt-2">Comprehensive feedback collection and management system for Mau Bank Malaysia</CardDescription>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowBulkUpload(!showBulkUpload)}
                variant="outline"
                className="flex items-center bg-white/10 hover:bg-white/20 text-white border-white/20 dark:bg-white/20 dark:hover:bg-white/30 dark:text-blue-100 dark:border-white/30"
              >
                <Plus className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center bg-white text-blue-800 hover:bg-blue-50 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Feedback
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 rounded-lg border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 rounded-lg border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-900 dark:text-gray-100">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="h-11 rounded-lg border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-900 dark:text-gray-100">
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="ATM">ATM</SelectItem>
                <SelectItem value="OnlineBanking">Online Banking</SelectItem>
                <SelectItem value="CoreBanking">Core Banking</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="From date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="pl-10 h-11 rounded-lg border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="To date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="pl-10 h-11 rounded-lg border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center px-3 py-1.5 bg-gray-50 dark:bg-gray-800 dark:text-gray-100">
                <Filter className="w-3 h-3 mr-1" />
                {searchTerm || statusFilter !== 'all' || serviceFilter !== 'all' || dateFromFilter || dateToFilter ? 'Filtered' : 'All Data'}
              </Badge>
              {(searchTerm || statusFilter !== 'all' || serviceFilter !== 'all' || dateFromFilter || dateToFilter) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Upload */}
      {showBulkUpload && (
        <div className="transition-all duration-300 ease-in-out">
          <BulkUpload />
        </div>
      )}

      {/* Add Feedback Form */}
      {showAddForm && (
        <Card className="border-none shadow-lg bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-t-lg dark:from-green-900 dark:to-green-700">
            <CardTitle className="text-2xl font-bold dark:text-white">Add New Customer Feedback</CardTitle>
            <CardDescription className="text-green-100 dark:text-green-200 mt-2">Manually enter customer feedback into the system</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customerId" className="text-sm font-medium text-gray-700 dark:text-gray-200">Customer ID</Label>
                  <Input
                    id="customerId"
                    value={formData.customerId}
                    onChange={(e) => handleInputChange('customerId', e.target.value)}
                    placeholder="CUST001"
                    className="h-11 rounded-lg border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-sm font-medium text-gray-700 dark:text-gray-200">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    required
                    className="h-11 rounded-lg border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="text-sm font-medium text-gray-700 dark:text-gray-200">Phone Number</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    placeholder="+60-12-3456789"
                    className="h-11 rounded-lg border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail" className="text-sm font-medium text-gray-700 dark:text-gray-200">Email Address</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    className="h-11 rounded-lg border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceType" className="text-sm font-medium text-gray-700 dark:text-gray-200">Service Type *</Label>
                  <Select value={formData.serviceType} onValueChange={(value) => handleInputChange('serviceType', value)}>
                    <SelectTrigger className="h-11 rounded-lg border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:text-gray-100">
                      <SelectItem value="ATM">ATM</SelectItem>
                      <SelectItem value="OnlineBanking">Online Banking</SelectItem>
                      <SelectItem value="CoreBanking">Core Banking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reviewRating" className="text-sm font-medium text-gray-700 dark:text-gray-200">Rating (1-5) *</Label>
                  <Select value={formData.reviewRating} onValueChange={(value) => handleInputChange('reviewRating', value)}>
                    <SelectTrigger className="h-11 rounded-lg border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:text-gray-100">
                      <SelectItem value="1">1 - Very Poor</SelectItem>
                      <SelectItem value="2">2 - Poor</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="4">4 - Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issueLocation" className="text-sm font-medium text-gray-700 dark:text-gray-200">Issue Location</Label>
                  <Select value={formData.issueLocation} onValueChange={(value) => handleInputChange('issueLocation', value)}>
                    <SelectTrigger className="h-11 rounded-lg border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:text-gray-100">
                      <SelectItem value="Kuala Lumpur">Kuala Lumpur</SelectItem>
                      <SelectItem value="Selangor">Selangor</SelectItem>
                      <SelectItem value="Penang">Penang</SelectItem>
                      <SelectItem value="Johor Bahru">Johor Bahru</SelectItem>
                      <SelectItem value="Melaka">Melaka</SelectItem>
                      <SelectItem value="Ipoh">Ipoh</SelectItem>
                      <SelectItem value="Kota Kinabalu">Kota Kinabalu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactedBankPerson" className="text-sm font-medium text-gray-700 dark:text-gray-200">Bank Employee Contacted</Label>
                  <Input
                    id="contactedBankPerson"
                    value={formData.contactedBankPerson}
                    onChange={(e) => handleInputChange('contactedBankPerson', e.target.value)}
                    placeholder="Employee name"
                    className="h-11 rounded-lg border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="reviewText" className="text-sm font-medium text-gray-700 dark:text-gray-200">Review Text *</Label>
                  <Textarea
                    id="reviewText"
                    value={formData.reviewText}
                    onChange={(e) => handleInputChange('reviewText', e.target.value)}
                    placeholder="Customer feedback text..."
                    rows={4}
                    required
                    className="rounded-lg border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                  disabled={isCreating}
                >
                  {isCreating ? 'Saving...' : 'Save Feedback'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Feedback Table */}
      <Card className="border-none shadow-lg bg-white dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-t-lg dark:from-purple-900 dark:to-purple-700">
          <CardTitle className="text-2xl font-bold dark:text-white">Customer Feedback Records</CardTitle>
          <CardDescription className="text-purple-100 dark:text-purple-200 mt-2">View and manage all customer feedback entries from the database</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <FeedbackTable 
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            serviceFilter={serviceFilter}
            dateFromFilter={dateFromFilter}
            dateToFilter={dateToFilter}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackManagement;
