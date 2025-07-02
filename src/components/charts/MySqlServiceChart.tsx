import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie } from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';

interface MySqlServiceChartProps {
  filters?: any;
  chartType?: 'bar' | 'line' | 'pie';
}

const MySqlServiceChart: React.FC<MySqlServiceChartProps> = ({ filters = {}, chartType = 'bar' }) => {
  const { serviceData, isLoading } = useAnalytics(filters);

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-gray-500">Loading service data...</div>
      </div>
    );
  }

  if (!serviceData || serviceData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-gray-500">No service data available</div>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'bar' ? (
          <BarChart data={serviceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="service" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="positive" fill="#10B981" name="Positive" />
            <Bar dataKey="negative" fill="#EF4444" name="Negative" />
          </BarChart>
        ) : chartType === 'line' ? (
          <LineChart data={serviceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="service" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="positive" stroke="#10B981" strokeWidth={3} name="Positive" />
            <Line type="monotone" dataKey="negative" stroke="#EF4444" strokeWidth={3} name="Negative" />
          </LineChart>
        ) : (
          <PieChart>
            <Pie
              data={serviceData}
              dataKey="positive"
              nameKey="service"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#10B981"
              label
            />
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default MySqlServiceChart;
