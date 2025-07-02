import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, List, MapPin, FileText, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mysqlService } from '@/services/mysqlService';

type SummaryType = 'Overall' | 'Positive' | 'Negative';
type ServiceType = 'Overall' | 'Core Banking' | 'ATM' | 'Online Banking';
type ScopeType = 'All' | 'per_location';
type LocationType = 'Delhi' | 'Mumbai' | 'Chennai' | 'Kolkata';

const SummaryViewer: React.FC = () => {
  const { toast } = useToast();

  const [service, setService] = useState<ServiceType>('Overall');
  const [summaryType, setSummaryType] = useState<SummaryType>('Overall');
  const [scope, setScope] = useState<ScopeType>('All');
  const [location, setLocation] = useState<LocationType>('Delhi');
  const [summaryText, setSummaryText] = useState('');
  const [loading, setLoading] = useState(false);

  const showLocation = scope === 'per_location';

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        service,
        summary_type: summaryType,
        scope,
        ...(scope === 'per_location' && { location }),
      });

      const res = await fetch(`${mysqlService.apiBaseUrl}/summaries?${params.toString()}`);
      const data = await res.json();
      const summary = data.data?.[0]?.summary_text || 'No summary found';
      setSummaryText(summary);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load summary.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-5">
      <div className="flex items-start space-x-3 mb-6">
        <Sparkles className="w-8 h-8 text-purple-600 mt-1" />
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">NLP Summaries</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View auto-generated summaries by service, sentiment, and location
          </p>
        </div>
      </div>

      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900 dark:text-white">Filters</CardTitle>
          <CardDescription>Select parameters to fetch the appropriate summary</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <select
            className="bg-white dark:bg-gray-800 border p-2 rounded text-sm"
            value={service}
            onChange={(e) => setService(e.target.value as ServiceType)}
          >
            <option value="Overall">Overall</option>
            <option value="Core Banking">Core Banking</option>
            <option value="ATM">ATM</option>
            <option value="Online Banking">Online Banking</option>
          </select>

          <select
            className="bg-white dark:bg-gray-800 border p-2 rounded text-sm"
            value={summaryType}
            onChange={(e) => setSummaryType(e.target.value as SummaryType)}
          >
            <option value="Overall">Overall</option>
            <option value="Positive">Positive</option>
            <option value="Negative">Negative</option>
          </select>

          <select
            className="bg-white dark:bg-gray-800 border p-2 rounded text-sm"
            value={scope}
            onChange={(e) => setScope(e.target.value as ScopeType)}
          >
            <option value="All">Across All Locations</option>
            <option value="per_location">Per Location</option>
          </select>

          {showLocation && (
            <select
              className="bg-white dark:bg-gray-800 border p-2 rounded text-sm"
              value={location}
              onChange={(e) => setLocation(e.target.value as LocationType)}
            >
              <option>Kuala Lumpur</option>
              <option>Selangor</option>
              <option>Penang</option>
              <option>Johor Bahru</option>
              <option>Melaka</option>
              <option>Ipoh</option>
              <option>Kota Kinabalu</option>
            </select>
          )}

          <Button onClick={fetchSummary} disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <List className="w-4 h-4 mr-2" />}
            Load Summary
          </Button>
        </CardContent>
      </Card>

      <Card className="border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-green-600 dark:text-green-300" />
            <CardTitle className="text-md text-green-800 dark:text-green-200">Generated Summary</CardTitle>
          </div>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
            Based on selected filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
            {summaryText}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryViewer;
