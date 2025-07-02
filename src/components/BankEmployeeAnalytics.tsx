
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, TrendingUp, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import EmployeePerformanceChart from '@/components/charts/EmployeePerformanceChart';
import { useMySQLFeedback } from '@/hooks/useMySQLData';

const BankEmployeeAnalytics = () => {
  // Fetch all feedback data from MySQL to calculate employee statistics
  const { data: feedbackData = [], isLoading, error } = useMySQLFeedback({});

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-red-800">
                Failed to load employee data. Please check your MySQL database connection.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!feedbackData || feedbackData.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-600">No feedback data available. Please add feedback records to the MySQL database.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate employee statistics from feedback data
  const employeeStats = new Map();
  
  feedbackData.forEach((feedback: any) => {
    const employeeName = feedback.contacted_bank_person;
    if (employeeName && employeeName.trim() !== '') {
      if (!employeeStats.has(employeeName)) {
        employeeStats.set(employeeName, {
          name: employeeName,
          department: 'Customer Service', // Default department
          branch_location: feedback.issue_location || 'Main Branch',
          total_interactions: 0,
          total_rating: 0,
          resolved_count: 0,
          contacted_count: 0,
          positive_count: 0,
          negative_count: 0
        });
      }
      
      const stats = employeeStats.get(employeeName);
      stats.total_interactions++;
      stats.contacted_count++;
      stats.total_rating += feedback.review_rating || 0;
      
      if (feedback.status === 'resolved') {
        stats.resolved_count++;
      }
      
      if (feedback.positive_flag) {
        stats.positive_count++;
      }
      
      if (feedback.negative_flag) {
        stats.negative_count++;
      }
    }
  });

  const employeeStatsArray = Array.from(employeeStats.values()).map((employee: any) => ({
    ...employee,
    avg_rating: employee.total_interactions > 0 ? employee.total_rating / employee.total_interactions : 0,
    resolution_rate: employee.total_interactions > 0 ? (employee.resolved_count / employee.total_interactions) * 100 : 0
  }));

  const getPerformanceBadge = (rating: number) => {
    if (rating >= 4.5) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (rating >= 4.0) return { label: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (rating >= 3.5) return { label: 'Average', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Calculate aggregate statistics
  const totalEmployees = employeeStatsArray.length;
  const avgRating: number = employeeStatsArray.length > 0 ? 
    employeeStatsArray.reduce((sum: number, emp: any) => sum + (emp.avg_rating || 0), 0) / employeeStatsArray.length : 0;
  
  const totalContacts: number = employeeStatsArray.reduce((sum: number, emp: any) => sum + (emp.contacted_count || 0), 0);
  
  const avgResolutionRate: number = employeeStatsArray.length > 0 ? 
    employeeStatsArray.reduce((sum: number, emp: any) => sum + (emp.resolution_rate || 0), 0) / employeeStatsArray.length : 0;

  return (
    <div className="space-y-6 py-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Active Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-blue-100 text-sm">Currently handling feedback</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
            <p className="text-green-100 text-sm">Overall performance</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Resolution Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgResolutionRate)}%</div>
            <p className="text-purple-100 text-sm">Average across team</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Total Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
            <p className="text-orange-100 text-sm">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Performance Trends</CardTitle>
          <CardDescription>Performance metrics from MySQL feedback data</CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeePerformanceChart />
        </CardContent>
      </Card>

      {/* Employee Details */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Performance Details</CardTitle>
          <CardDescription>Individual employee statistics calculated from feedback data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employeeStatsArray.map((employee: any, index: number) => {
              const performanceBadge = getPerformanceBadge(employee.avg_rating || 0);
              
              return (
                <Card key={index} className="p-4">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-blue-100 text-blue-800 font-semibold">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{employee.name}</h3>
                          <p className="text-sm text-gray-600">{employee.department} • {employee.branch_location}</p>
                        </div>
                        <Badge className={performanceBadge.color}>
                          {performanceBadge.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-xl font-bold text-blue-600">{employee.contacted_count || 0}</div>
                          <div className="text-xs text-gray-600">Contacts</div>
                        </div>
                        
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-xl font-bold text-green-600">{(employee.avg_rating || 0).toFixed(1)}</div>
                          <div className="text-xs text-gray-600">Avg Rating</div>
                        </div>
                        
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-xl font-bold text-purple-600">{employee.resolved_count || 0}</div>
                          <div className="text-xs text-gray-600">Resolved</div>
                        </div>
                        
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-xl font-bold text-orange-600">{(employee.resolution_rate || 0).toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">Success Rate</div>
                        </div>
                        
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-xl font-bold text-indigo-600">{employee.positive_count || 0}</div>
                          <div className="text-xs text-gray-600">Positive</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Resolution Rate</span>
                          <span>{(employee.resolution_rate || 0).toFixed(1)}%</span>
                        </div>
                        <Progress value={employee.resolution_rate || 0} className="h-2" />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankEmployeeAnalytics;
