
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';

const CSVTemplate = () => {
  const generateTemplate = () => {
    const headers = [
      'Review Rating',
      'Customer ID', 
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Service Type',
      'Review Text',
      'Date',
      'Issue Location',
      'Contacted Bank Person'
    ];
    
    const sampleData = [
      '5',
      'CUST001',
      'John Doe',
      '+60-12-3456789',
      'john.doe@email.com',
      'ATM',
      'Great service, very satisfied with the ATM experience.',
      '2024-01-15',
      'Kuala Lumpur',
      'Sarah Ahmad'
    ];
    
    const csvContent = [
      headers.join(','),
      sampleData.join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'feedback_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={generateTemplate} 
        variant="outline" 
        className="mb-4"
      >
        <Download className="w-4 h-4 mr-2" />
        Download CSV Template
      </Button>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Service Type Mapping:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>ATM:</strong> Use "ATM" in the Service Type column</p>
          <p><strong>Online Banking:</strong> Use "OnlineBanking" or "Online Banking"</p>
          <p><strong>Core Banking:</strong> Use "CoreBanking" or "Core Banking"</p>
          <p className="mt-2 text-blue-600">
            Note: The system will automatically map variations (e.g., "online", "mobile", "digital" → OnlineBanking)
          </p>
        </div>
      </div>
    </div>
  );
};

export default CSVTemplate;
