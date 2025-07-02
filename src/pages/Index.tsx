
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from '@/components/Dashboard';
import FeedbackManagement from '@/components/FeedbackManagement';
import IssueEndorsement from '@/components/IssueEndorsement';
import BankEmployeeAnalytics from '@/components/BankEmployeeAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, MessageSquare, Users, CheckCircle, Database } from 'lucide-react';
import { useMySQLMetrics } from '@/hooks/useMySQLData';

const Index = () => {
  const { data: overallMetrics, isLoading } = useMySQLMetrics({});

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 ">
      {/* Header */}
      <div className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mau Bank VoC Analysis</h1>
              <p className="text-gray-600 mt-1">Customer Feedback Intelligence & Resolution System - MySQL Database</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg flex items-center">
                <Database className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">MySQL Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Total Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "Loading..." : overallMetrics?.total || 0}
              </div>
              <p className="text-green-100 text-sm">From MySQL database</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Avg Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "Loading..." : overallMetrics?.avgRating?.toFixed(1) || "0.0"}
              </div>
              <p className="text-blue-100 text-sm">Current average</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Positive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "Loading..." : overallMetrics?.positive || 0}
              </div>
              <p className="text-purple-100 text-sm">
                {isLoading ? "Loading..." : `${Math.round((overallMetrics?.positive || 0) / (overallMetrics?.total || 1) * 100)}% positive`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Negative
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "Loading..." : overallMetrics?.negative || 0}
              </div>
              <p className="text-orange-100 text-sm">
                {isLoading ? "Loading..." : `${Math.round((overallMetrics?.negative || 0) / (overallMetrics?.total || 1) * 100)}% negative`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Analytics Dashboard
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Feedback Management
            </TabsTrigger>
            <TabsTrigger value="issues" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Issue Endorsement
            </TabsTrigger>
            <TabsTrigger value="employees" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Employee Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="feedback" className="mt-6">
            <FeedbackManagement />
          </TabsContent>

          <TabsContent value="issues" className="mt-6">
            <IssueEndorsement />
          </TabsContent>

          <TabsContent value="employees" className="mt-6">
            <BankEmployeeAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
