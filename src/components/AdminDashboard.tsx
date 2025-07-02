import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, MessageSquare, Star, TrendingUp, ArrowUp, ArrowDown, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { mysqlService } from '@/services/mysqlService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Dummy data for customer satisfaction when no data is available
const dummySatisfactionData = {
  current: 4.2,
  previous: 3.8,
  trend: 'up',
  breakdown: [
    { name: 'Very Satisfied', value: 45 },
    { name: 'Satisfied', value: 30 },
    { name: 'Neutral', value: 15 },
    { name: 'Dissatisfied', value: 7 },
    { name: 'Very Dissatisfied', value: 3 },
  ]
};

const AdminDashboard = () => {
  // Fetch metrics data
  const { data: metricsData, isLoading: loadingMetrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const response = await fetch(`${mysqlService.apiBaseUrl}/metrics`);
      return response.json();
    },
  });

  // Fetch pending issues
  const { data: pendingIssues = [], isLoading: loadingPending } = useQuery({
    queryKey: ['pending-issues'],
    queryFn: async () => {
      const response = await fetch(`${mysqlService.apiBaseUrl}/pending-issues`);
      return response.json();
    },
  });

  // Fetch approved issues
  const { data: approvedIssues = [], isLoading: loadingApproved } = useQuery({
    queryKey: ['approved-issues'],
    queryFn: async () => {
      const response = await fetch(`${mysqlService.apiBaseUrl}/approved-issues`);
      return response.json();
    },
  });

  // Fetch rejected issues
  const { data: rejectedIssues = [], isLoading: loadingRejected } = useQuery({
    queryKey: ['rejected-issues'],
    queryFn: async () => {
      const response = await fetch(`${mysqlService.apiBaseUrl}/rejected-issues`);
      return response.json();
    },
  });

  // Fetch employee performance data
  const { data: employeePerformance = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employee-performance'],
    queryFn: async () => {
      const response = await fetch(`${mysqlService.apiBaseUrl}/employee-performance`);
      return response.json();
    },
  });

  // Add state for filters
  const [selectedService, setSelectedService] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');

  // Fetch sentiment analysis data
  const { data: sentimentData = { sentimentData: [], total: 0, avgRating: 0 }, isLoading: loadingSentiment } = useQuery({
    queryKey: ['sentiment-analysis', selectedService, selectedLocation, selectedDateRange],
    queryFn: async () => {
      const response = await fetch(
        `${mysqlService.apiBaseUrl}/sentiment-analysis?service_type=${selectedService}&location=${selectedLocation}&dateRange=${selectedDateRange}`
      );
      return response.json();
    },
  });

  // Fetch feedback summary
  const { data: feedbackSummary = [], isLoading: loadingFeedback } = useQuery({
    queryKey: ['feedback-summary', selectedService, selectedLocation, selectedDateRange],
    queryFn: async () => {
      const response = await fetch(
        `${mysqlService.apiBaseUrl}/feedback-summary?service_type=${selectedService}&location=${selectedLocation}&dateRange=${selectedDateRange}`
      );
      return response.json();
    },
  });

  // Fetch locations for filter
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await fetch(`${mysqlService.apiBaseUrl}/locations`);
      return response.json();
    },
  });

  if (loadingMetrics || loadingPending || loadingApproved || loadingRejected || loadingEmployees || loadingSentiment || loadingFeedback) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  // Calculate resolution rate based on actual data
  const totalIssues = approvedIssues.length + rejectedIssues.length + pendingIssues.length;
  const resolvedIssues = approvedIssues.length + rejectedIssues.length;
  const resolutionRate = totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 0;

  // Prepare category data for the bar chart based on actual data
  const categoryData = [
    {
      name: 'ATM',
      pending: pendingIssues.filter(issue => issue.category === 'ATM').length,
      approved: approvedIssues.filter(issue => issue.category === 'ATM').length,
      rejected: rejectedIssues.filter(issue => issue.category === 'ATM').length
    },
    {
      name: 'Online Banking',
      pending: pendingIssues.filter(issue => issue.category === 'OnlineBanking').length,
      approved: approvedIssues.filter(issue => issue.category === 'OnlineBanking').length,
      rejected: rejectedIssues.filter(issue => issue.category === 'OnlineBanking').length
    },
    {
      name: 'Core Banking',
      pending: pendingIssues.filter(issue => issue.category === 'CoreBanking').length,
      approved: approvedIssues.filter(issue => issue.category === 'CoreBanking').length,
      rejected: rejectedIssues.filter(issue => issue.category === 'CoreBanking').length
    }
  ];

  // Calculate average resolution time (in hours) from approved issues
  const avgResolutionTime = approvedIssues.length > 0
    ? approvedIssues.reduce((acc, issue) => {
        const created = new Date(issue.created_at);
        const approved = new Date(issue.approved_date);
        const hours = (approved.getTime() - created.getTime()) / (1000 * 60 * 60);
        return acc + hours;
      }, 0) / approvedIssues.length
    : 0;

  // Calculate average satisfaction from employee performance or use dummy data
  const satisfactionData = employeePerformance.length > 0
    ? {
        current: employeePerformance.reduce((acc: number, emp: any) => acc + emp.avg_rating, 0) / employeePerformance.length,
        previous: 4.0, // This should come from historical data
        trend: 'up',
        breakdown: dummySatisfactionData.breakdown
      }
    : dummySatisfactionData;

  // Prepare trend data for the last 7 days
  const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const trendData = getLast7Days().map(date => {
    const dayPending = pendingIssues.filter(issue => 
      new Date(issue.created_at).toISOString().split('T')[0] === date
    ).length;
    
    const dayApproved = approvedIssues.filter(issue => 
      new Date(issue.approved_date).toISOString().split('T')[0] === date
    ).length;
    
    const dayRejected = rejectedIssues.filter(issue => 
      new Date(issue.created_at).toISOString().split('T')[0] === date
    ).length;

    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      pending: dayPending,
      approved: dayApproved,
      rejected: dayRejected,
      total: dayPending + dayApproved + dayRejected
    };
  });

  // Prepare confidence score distribution data
  const confidenceScoreData = [
    { range: '0.9-1.0', count: pendingIssues.filter(issue => issue.confidence_score >= 0.9).length },
    { range: '0.8-0.9', count: pendingIssues.filter(issue => issue.confidence_score >= 0.8 && issue.confidence_score < 0.9).length },
    { range: '0.7-0.8', count: pendingIssues.filter(issue => issue.confidence_score >= 0.7 && issue.confidence_score < 0.8).length },
    { range: '0.6-0.7', count: pendingIssues.filter(issue => issue.confidence_score >= 0.6 && issue.confidence_score < 0.7).length },
    { range: '0.5-0.6', count: pendingIssues.filter(issue => issue.confidence_score >= 0.5 && issue.confidence_score < 0.6).length },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-blue-800/20 border-blue-100 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Issues</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalIssues}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Total customer issues</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-100 dark:border-yellow-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending Issues</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{pendingIssues.length}</div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-green-800/20 border-green-100 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Approved Issues</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{approvedIssues.length}</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Successfully resolved</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-red-800/20 border-red-100 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Rejected Issues</CardTitle>
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">{rejectedIssues.length}</div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">Not actionable</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-purple-800/20 border-purple-100 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Avg. Resolution Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{avgResolutionTime.toFixed(1)}h</div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Time to resolution</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts - add margin-top for separation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Resolution Rate */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/20 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">Issue Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Resolved', value: resolutionRate },
                      { name: 'Pending', value: 100 - resolutionRate },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#4CAF50" />
                    <Cell fill="#FFC107" />
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `${Number(value).toFixed(1)}%`}
                    contentStyle={{ 
                      backgroundColor: 'var(--background-color)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {value} ({entry.payload.value.toFixed(1)}%)
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Issues by Category */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/20 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">Issues by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--background-color)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{value}</span>
                    )}
                  />
                  <Bar dataKey="pending" name="Pending Issues" fill="#FFC107" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approved" name="Approved Issues" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rejected" name="Rejected Issues" fill="#FF5252" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Issue Trends Over Time */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/20 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">Issue Trends (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--background-color)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{value}</span>
                    )}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pending" 
                    name="Pending Issues" 
                    stackId="1" 
                    stroke="#FFC107" 
                    fill="#FFC107" 
                    fillOpacity={0.3} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="approved" 
                    name="Approved Issues" 
                    stackId="1" 
                    stroke="#4CAF50" 
                    fill="#4CAF50" 
                    fillOpacity={0.3} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rejected" 
                    name="Rejected Issues" 
                    stackId="1" 
                    stroke="#FF5252" 
                    fill="#FF5252" 
                    fillOpacity={0.3} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Confidence Score Distribution */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/20 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">Issue Confidence Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confidenceScoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="range" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--background-color)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)'
                    }}
                    formatter={(value) => [`${value} issues`, 'Count']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Number of Issues</span>
                    )}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Number of Issues"
                    fill="#8884d8" 
                    radius={[4, 4, 0, 0]}
                    label={{ position: 'top' }}
                  >
                    {confidenceScoreData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.range === '0.9-1.0' ? '#4CAF50' : 
                              entry.range === '0.8-0.9' ? '#8BC34A' :
                              entry.range === '0.7-0.8' ? '#FFC107' :
                              entry.range === '0.6-0.7' ? '#FF9800' :
                              '#FF5252'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Issues */}
      <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/20 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">Recent Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingIssues.slice(0, 5).map((issue) => (
              <div key={issue.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{issue.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{issue.category}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                    View Details
                  </Button>
                  <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600">
                    Approve
                  </Button>
                  <Button variant="destructive" size="sm" className="hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600">
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard; 