import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mysqlService } from '@/services/mysqlService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, AreaChart, Area } from 'recharts';
import { ThumbsUp, ThumbsDown, MessageSquare, AlertCircle, BarChart2, Filter, TrendingUp, MapPin, Clock, Building2, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';

// Add interfaces for location analysis
interface LocationSentimentDistribution {
  positive: number;
  negative: number;
  neutral: number;
}

interface LocationOverviewData {
  total_feedback: number;
  avg_rating: number;
  sentiment_distribution: LocationSentimentDistribution;
  service_types?: { [service: string]: number };
}

interface MonthlyTrendData {
  positive: number;
  negative: number;
  neutral: number;
}

interface LocationIssue {
  review_rating: number;
  service_type: string;
  occurrence: number;
  review_text: string;
}

interface LocationAnalysis {
  location_analysis: { [location: string]: LocationOverviewData };
  monthly_trends: { [date: string]: MonthlyTrendData };
  location_issues: { [location: string]: LocationIssue[] };
}

const TOP_CARDS = 6;

const CustomerSentimental: React.FC = () => {
  const [selectedService, setSelectedService] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [activeTab, setActiveTab] = useState<'positive' | 'negative'>('positive');
  const [showAll, setShowAll] = useState(false);
  const [analyticsModal, setAnalyticsModal] = useState<{ open: boolean, location: string | null }>({ open: false, location: null });
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDescription, setAnalyticsDescription] = useState<string | null>(null);

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

  // Fetch sentiment trends
  const { data: sentimentTrends = [], isLoading: loadingTrends } = useQuery({
    queryKey: ['sentiment-trends', selectedDateRange],
    queryFn: async () => {
      const response = await fetch(
        `${mysqlService.apiBaseUrl}/sentiment-trends?dateRange=${selectedDateRange}`
      );
      return response.json();
    },
  });

  // Fetch transaction analysis
  const { data: transactionAnalysis = [], isLoading: loadingTransaction } = useQuery({
    queryKey: ['transaction-analysis', selectedDateRange],
    queryFn: async () => {
      const response = await fetch(
        `${mysqlService.apiBaseUrl}/transaction-analysis?dateRange=${selectedDateRange}`
      );
      return response.json();
    },
  });

  // Fetch location trends if location is selected
  const { data: locationTrends = [], isLoading: loadingLocation } = useQuery({
    queryKey: ['location-trends', selectedLocation, selectedDateRange],
    queryFn: async () => {
      if (selectedLocation === 'all') return [];
      const response = await fetch(
        `${mysqlService.apiBaseUrl}/location-trends?location=${selectedLocation}&dateRange=${selectedDateRange}`
      );
      return response.json();
    },
    enabled: selectedLocation !== 'all',
  });

  // Fetch feedback summary with enhanced analysis
  const { data: feedbackSummary = [], isLoading: loadingFeedback } = useQuery({
    queryKey: ['feedback-summary', selectedService, selectedLocation, selectedDateRange],
    queryFn: async () => {
      const response = await fetch(
        `${mysqlService.apiBaseUrl}/feedback-summary?service_type=${selectedService}&location=${selectedLocation}&dateRange=${selectedDateRange}`
      );
      const data = await response.json();
      
      const enhancedData = await Promise.all(data.map(async (feedback) => {
        try {
          const analysisResponse = await fetch(`${mysqlService.apiBaseUrl}/enhanced-feedback-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              feedback_text: feedback.review_text,
              rating: feedback.rating,
              service_type: feedback.service_type,
              location: feedback.location
            })
          });
          
          const analysis = await analysisResponse.json();
          return { ...feedback, analysis };
        } catch (error) {
          console.error('Error analyzing feedback:', error);
          return feedback;
        }
      }));
      
      return enhancedData;
    },
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await fetch(`${mysqlService.apiBaseUrl}/locations`);
      return response.json();
    },
  });

  // Fetch location-based feedback analysis
  const { data: locationAnalysis = { location_analysis: {}, monthly_trends: {}, location_issues: {} }, isLoading: loadingLocationAnalysis } = useQuery<LocationAnalysis>({
    queryKey: ['location-feedback-analysis', selectedDateRange],
    queryFn: async () => {
      const response = await fetch(
        `${mysqlService.apiBaseUrl}/location-feedback-analysis?dateRange=${selectedDateRange}`
      );
      return response.json();
    },
  });

  // Fetch location-specific feedback details
  const { data: locationFeedbackDetails = [], isLoading: loadingLocationDetails } = useQuery({
    queryKey: ['location-feedback-details', selectedLocation, selectedDateRange],
    queryFn: async () => {
      if (selectedLocation === 'all') return [];
      const response = await fetch(
        `${mysqlService.apiBaseUrl}/location-feedback-details?location=${selectedLocation}&dateRange=${selectedDateRange}`
      );
      return response.json();
    },
    enabled: selectedLocation !== 'all',
  });

  // Prepare sorted location cards for the Location-Based Feedback Analysis
  const locationCards = Object.entries(locationAnalysis.location_analysis || {})
    .map(([location, data]) => ({ location, ...data }))
    .sort((a, b) => {
      if (activeTab === 'positive') {
        // Sort by avg_rating desc, then positive feedback desc
        if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
        return b.sentiment_distribution.positive - a.sentiment_distribution.positive;
      } else {
        // Sort by avg_rating asc, then negative feedback desc
        if (a.avg_rating !== b.avg_rating) return a.avg_rating - b.avg_rating;
        return b.sentiment_distribution.negative - a.sentiment_distribution.negative;
      }
    })
    .filter(card =>
      activeTab === 'positive'
        ? card.sentiment_distribution.positive > 0
        : card.sentiment_distribution.negative > 0
    );

  const visibleCards = showAll ? locationCards : locationCards.slice(0, TOP_CARDS);

  // Fetch analytics data for the selected location
  const fetchAnalyticsData = async (location: string) => {
    setAnalyticsLoading(true);
    setAnalyticsDescription(null);
    try {
      const response = await fetch(`${mysqlService.apiBaseUrl}/location-feedback-details?location=${encodeURIComponent(location)}&dateRange=${selectedDateRange}`);
      const data = await response.json();
      setAnalyticsData(data);
      // Fetch analytics description from backend
      const descRes = await fetch(`${mysqlService.apiBaseUrl}/location-analytics-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, dateRange: selectedDateRange })
      });
      const descData = await descRes.json();
      setAnalyticsDescription(descData.description);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Filter Options</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Service Type</label>
              <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="ATM">ATM</SelectItem>
                  <SelectItem value="OnlineBanking">Online Banking</SelectItem>
                  <SelectItem value="CoreBanking">Core Banking</SelectItem>
                </SelectContent>
              </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Time Range</label>
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="last_week">Last Week</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_quarter">Last Quarter</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
      </div>

      {/* Sentiment Analysis Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2">
            <BarChart2 className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Customer Sentiment Analysis</h2>
          </div>
        </div>
        <div className="p-6">
            {loadingSentiment ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData.sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sentimentData.sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => (
                        <span style={{ color: '#666', fontSize: '12px' }}>
                          {value} ({entry.payload.value} feedbacks)
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col justify-center space-y-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">Overall Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Feedback</p>
                      <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{sentimentData.total}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Average Rating</p>
                      <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                        {Number(sentimentData.avgRating).toFixed(1)}/5
                  </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">Sentiment Distribution</h3>
                  <div className="space-y-3">
                    {sentimentData.sentimentData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-300">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            {Number(item.value).toFixed(1)}%
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({item.value} feedbacks)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            )}
        </div>
      </div>

      {/* Sentiment Trends */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Sentiment Trends</h2>
          </div>
        </div>
        <div className="p-6">
          {loadingTrends ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sentimentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="positive_percentage" name="Positive %" stroke="#4CAF50" />
                  <Line type="monotone" dataKey="negative_percentage" name="Negative %" stroke="#FF5252" />
                  <Line type="monotone" dataKey="avg_rating" name="Avg Rating" stroke="#2196F3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2">
            <BarChart2 className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Transaction Analysis</h2>
          </div>
        </div>
        <div className="p-6">
          {loadingTransaction ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service_type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="positive_percentage" name="Positive %" fill="#4CAF50" />
                  <Bar dataKey="negative_percentage" name="Negative %" fill="#FF5252" />
                </BarChart>
              </ResponsiveContainer>
              </div>
            )}
        </div>
      </div>

      {/* Location Trends */}
      {selectedLocation !== 'all' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Location Trends</h2>
            </div>
          </div>
          <div className="p-6">
            {loadingLocation ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {locationTrends.map((trend, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">
                        {trend.sentiment.charAt(0).toUpperCase() + trend.sentiment.slice(1)} Feedback
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Count: {trend.count} | Avg Rating: {trend.avg_rating}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {trend.feedback_texts.map((text, textIndex) => (
                        <p key={textIndex} className="text-sm text-gray-600 dark:text-gray-300">
                          {text}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Analysis Dashboard */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 pb-2 flex items-center">
          <Building2 className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Location-Based Feedback Analysis</h2>
        </div>
        {/* Button Row */}
        <div className="flex items-center justify-between px-6 pt-2 pb-6">
          <div className="flex space-x-4">
            <button
              className={`px-6 py-2 rounded-full font-semibold transition-all duration-150 ${
                activeTab === 'positive'
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 shadow'
                  : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-800'
              }`}
              onClick={() => setActiveTab('positive')}
            >
              Positive
            </button>
            <button
              className={`px-6 py-2 rounded-full font-semibold transition-all duration-150 ${
                activeTab === 'negative'
                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 shadow'
                  : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-800'
              }`}
              onClick={() => setActiveTab('negative')}
            >
              Negative
            </button>
          </div>
          <button
            className="text-green-700 dark:text-green-300 font-semibold hover:underline focus:outline-none"
            onClick={() => setShowAll(s => !s)}
          >
            {showAll ? 'Show less' : 'See more'}
          </button>
        </div>
        <div className="p-6 pt-0">
          {loadingLocationAnalysis ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleCards.map((data) => (
                <div key={data.location} className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-800 transition-transform hover:scale-[1.02] hover:shadow-lg">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 text-center flex items-center justify-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    {data.location}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <BarChart2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        Total Feedback
                      </span>
                      <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{data.total_feedback}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Star className="h-4 w-4 text-yellow-400" />
                        Average Rating
                      </span>
                      <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{data.avg_rating.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                        Positive Feedback
                      </span>
                      <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{data.sentiment_distribution.positive}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                        Negative Feedback
                      </span>
                      <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{data.sentiment_distribution.negative}</span>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <button onClick={() => { setAnalyticsModal({ open: true, location: data.location }); fetchAnalyticsData(data.location); }} title="View Analytics">
                      <BarChart2 className="h-5 w-5 text-blue-500 hover:text-blue-700" />
                    </button>
                  </div>
                </div>
              ))}
              {visibleCards.length === 0 && (
                <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">No data available for this tab.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Recent Feedback Analysis</h2>
          </div>
        </div>
        <div className="p-6">
          {loadingFeedback ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {feedbackSummary.map((feedback) => (
                <div 
                  key={feedback.id} 
                  className="group relative p-4 border border-gray-100 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-200 ease-in-out hover:shadow-md"
                >
                  <div className="absolute -top-2 -right-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      feedback.rating >= 4 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                        : feedback.rating >= 3 
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {feedback.rating}/5
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex space-x-2">
                      <div className={`p-2 rounded-full transition-colors duration-200 ${
                        feedback.sentiment === 'Positive' 
                          ? 'bg-green-100 dark:bg-green-900 group-hover:bg-green-200 dark:group-hover:bg-green-800' 
                          : 'bg-red-100 dark:bg-red-900 group-hover:bg-red-200 dark:group-hover:bg-red-800'
                    }`}>
                      {feedback.sentiment === 'Positive' ? (
                        <ThumbsUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <ThumbsDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      {feedback.sentiment !== 'Positive' && (
                        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900 group-hover:bg-red-200 dark:group-hover:bg-red-800 transition-colors duration-200">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">{feedback.summary}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          feedback.sentiment === 'Positive' 
                            ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800' 
                            : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800'
                        }`}>
                          {feedback.sentiment}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                          {feedback.service_type}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                          {feedback.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {feedback.analysis && (
                    <div className="mt-2 pl-12">
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                        {feedback.analysis.sentiment_analysis && (
                          <div className="mb-2">
                            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                              {feedback.analysis.sentiment_analysis.key_points.map((point, index) => (
                                <span key={index} className="block">• {point}</span>
                              ))}
                            </p>
                          </div>
                        )}
                        {feedback.analysis.issue_analysis && feedback.analysis.issue_analysis.core_issue && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Issue Analysis:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                              {feedback.analysis.issue_analysis.core_issue}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
                                {feedback.analysis.issue_analysis.category}
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
                                Severity: {feedback.analysis.issue_analysis.severity}
                              </span>
                            </div>
                          </div>
                        )}
                        {feedback.analysis.suggested_resolution && (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-800">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Suggested Resolution:</p>
                            {feedback.analysis.suggested_resolution.immediate_actions.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Immediate Actions:</p>
                                <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-200">
                                  {feedback.analysis.suggested_resolution.immediate_actions.map((action, index) => (
                                    <li key={index}>{action}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {feedback.analysis.suggested_resolution.long_term_solutions.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Long-term Solutions:</p>
                                <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-200">
                                  {feedback.analysis.suggested_resolution.long_term_solutions.map((solution, index) => (
                                    <li key={index}>{solution}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      <Dialog open={analyticsModal.open} onOpenChange={open => setAnalyticsModal({ open, location: open ? analyticsModal.location : null })}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>Analytics for {analyticsModal.location}</DialogTitle>
            <DialogClose />
          </DialogHeader>
          {analyticsLoading ? (
            <div className="flex items-center justify-center h-40">Loading...</div>
          ) : analyticsData ? (
            <div>
              {/* Bar chart for service_type vs positive/negative review_rating */}
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getBarChartData(analyticsData)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="service_type" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="positive" fill="#4CAF50" name="Positive" />
                    <Bar dataKey="negative" fill="#FF5252" name="Negative" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Analytics description from backend */}
              <div className="space-y-4">
                {analyticsDescription ? (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-gray-700 dark:text-gray-200 text-sm min-h-[80px]">
                    {analyticsDescription.split(/\n{2,}/).map((section, idx) => {
                      let icon = null;
                      let title = '';
                      let color = '';
                      if (/positive/i.test(section)) {
                        icon = <ThumbsUp className="h-5 w-5 text-green-600 mr-2 inline" />;
                        title = 'Positive Aspects';
                        color = 'text-green-700';
                      } else if (/negative|issue|problem/i.test(section)) {
                        icon = <ThumbsDown className="h-5 w-5 text-red-600 mr-2 inline" />;
                        title = 'Negative Aspects';
                        color = 'text-red-700';
                      } else if (/suggest|improve|recommend/i.test(section)) {
                        icon = <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 inline" />;
                        title = 'Suggestions';
                        color = 'text-yellow-700';
                      }
                      return (
                        <div key={idx} className="mb-2">
                          {icon && <span>{icon}</span>}
                          {title && <span className={`font-semibold ${color}`}>{title}</span>}
                          <div className="ml-7">{section}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-gray-400">No analytics description available.</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No analytics data available.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function getBarChartData(feedbacks: any[]) {
  const grouped: Record<string, { positive: number, negative: number }> = {};
  feedbacks.forEach(fb => {
    const st = fb.service_type;
    if (!grouped[st]) grouped[st] = { positive: 0, negative: 0 };
    if (fb.review_rating >= 4) grouped[st].positive++;
    else if (fb.review_rating <= 3) grouped[st].negative++;
  });
  return Object.entries(grouped).map(([service_type, counts]) => ({ service_type, ...counts }));
}

const styles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default CustomerSentimental; 