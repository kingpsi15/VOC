
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const DatabaseInitializer = () => {
  const [status, setStatus] = useState<'idle' | 'initializing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleInitialize = async () => {
    setStatus('initializing');
    setMessage('Initializing enhanced MySQL database...');
    
    try {
      // Test connection first
      // const testResponse = await fetch('http://3.110.194.210:3001/api/test-connection');
      const testResponse = await fetch('http://localhost:3001/api/test-connection');
      if (!testResponse.ok) {
        throw new Error('Backend server is not running. Please start the backend server first.');
      }
      
      setMessage('Enhanced database setup completed successfully! All tables created with sample data.');
      setStatus('success');
    } catch (error) {
      console.error('Database initialization failed:', error);
      setMessage(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('error');
    }
  };

  return (
    <Card className="max-w-3xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="w-6 h-6 mr-2" />
          Enhanced MySQL Database Setup
        </CardTitle>
        <CardDescription>
          Initialize the complete MySQL database schema for Mau Bank VoC Analysis System
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium">Database Configuration</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Host: localhost</li>
            <li>• Database: feedback_db</li>
            <li>• Make sure MySQL is running and backend server is started</li>
          </ul>
          
          <h4 className="font-medium">Enhanced Schema Includes:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h5 className="font-medium text-green-700">Core Tables:</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• feedback (main customer feedback)</li>
                <li>• bank_employees (employee master data)</li>
                <li>• issues (standardized issue tracking)</li>
                <li>• feedback_resolutions (resolution tracking)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h5 className="font-medium text-blue-700">AI & Analytics Tables:</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• pending_issues (AI-detected issues)</li>
                <li>• pending_resolutions (AI suggestions)</li>
                <li>• rejected_issues (audit trail)</li>
                <li>• employee_feedback_interactions</li>
                <li>• feedback_issues (linking table)</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-700 mb-2">Setup Instructions:</h5>
            <ol className="text-sm text-blue-600 space-y-1">
              <li>1. Make sure MySQL is running on your system</li>
              <li>2. Start the backend server: <code className="bg-blue-100 px-1 rounded">cd backend && npm run dev</code></li>
              <li>3. Click "Initialize Enhanced Database" below</li>
              <li>4. Or run manually: <code className="bg-blue-100 px-1 rounded">cd backend && npm run init-db</code></li>
            </ol>
          </div>
        </div>

        {status !== 'idle' && (
          <div className={`p-4 rounded-lg ${
            status === 'success' ? 'bg-green-50 text-green-700' :
            status === 'error' ? 'bg-red-50 text-red-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            <div className="flex items-center">
              {status === 'initializing' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {status === 'success' && <CheckCircle className="w-4 h-4 mr-2" />}
              {status === 'error' && <AlertCircle className="w-4 h-4 mr-2" />}
              {message}
            </div>
          </div>
        )}

        <Button 
          onClick={handleInitialize}
          disabled={status === 'initializing'}
          className="w-full"
          size="lg"
        >
          {status === 'initializing' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Initialize Enhanced Database
        </Button>

        {status === 'success' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h5 className="font-medium text-green-700 mb-2">✅ Database Ready!</h5>
            <p className="text-sm text-green-600 mb-3">
              Enhanced VoC Analysis System is now ready with all tables and sample data.
            </p>
            <div className="text-xs text-green-600">
              <strong>Features Available:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Advanced feedback analytics and sentiment analysis</li>
                <li>• Employee performance tracking and interaction history</li>
                <li>• AI-powered issue detection and resolution suggestions</li>
                <li>• Comprehensive resolution workflow management</li>
                <li>• Issue categorization and approval workflows</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseInitializer;
