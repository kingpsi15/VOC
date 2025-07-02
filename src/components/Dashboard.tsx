
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Database, AlertCircle } from 'lucide-react';
import { useMySQLMetrics } from '@/hooks/useMySQLData';
import MySqlSentimentChart from '@/components/charts/MySqlSentimentChart';
import MySqlServiceChart from '@/components/charts/MySqlServiceChart';

const Dashboard = () => {
  const { data: metrics, isLoading, error } = useMySQLMetrics({});

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading MySQL data...</p>
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
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                Failed to connect to MySQL Database. Please check your backend server.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Connected to MySQL Database - Showing Live Data
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Total Feedback</span>
              <div className="flex items-center text-sm">
                {metrics?.trend && metrics.trend > 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {metrics?.trend ? `${metrics.trend > 0 ? '+' : ''}${metrics.trend.toFixed(1)}%` : '0%'}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold">{metrics?.total || 0}</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span>{metrics?.positive || 0} Positive</span>
              </div>
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span>{metrics?.negative || 0} Negative</span>
              </div>
            </div>
            <div className="pt-2 border-t border-white/20">
              <div className="text-xl font-bold">{metrics?.avgRating?.toFixed(1) || '0.0'}</div>
              <p className="text-sm opacity-90">Average Rating</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Resolved Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.resolved || 0}</div>
            <p className="text-sm opacity-90">Successfully resolved</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Pending Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.pending || 0}</div>
            <p className="text-sm opacity-90">Awaiting resolution</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Database Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total || 0}</div>
            <p className="text-sm opacity-90">Total entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
            <CardDescription>Real-time sentiment from MySQL database</CardDescription>
          </CardHeader>
          <CardContent>
            <MySqlSentimentChart filters={{}} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Performance</CardTitle>
            <CardDescription>Performance by service type from MySQL</CardDescription>
          </CardHeader>
          <CardContent>
            <MySqlServiceChart filters={{}} />
          </CardContent>
        </Card>
      </div>

      {/* Database Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Database Overview</CardTitle>
          <CardDescription>Live statistics from your MySQL database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics?.total || 0}</div>
              <p className="text-sm text-gray-600">Total Records</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics?.positive || 0}</div>
              <p className="text-sm text-gray-600">Positive Feedback</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{metrics?.negative || 0}</div>
              <p className="text-sm text-gray-600">Negative Feedback</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
