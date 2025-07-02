import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis, LineChart, Line } from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';

interface MySqlSentimentChartProps {
  filters?: any;
  chartType?: 'pie' | 'bar' | 'line';
}

const MySqlSentimentChart: React.FC<MySqlSentimentChartProps> = ({ filters = {}, chartType = 'pie' }) => {
  const { sentimentData, isLoading } = useAnalytics(filters);

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-gray-500">Loading sentiment data...</div>
      </div>
    );
  }

  if (!sentimentData || sentimentData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-gray-500">No sentiment data available</div>
      </div>
    );
  }

  // Filter out neutral sentiment as requested
  const filteredData = sentimentData.filter(item => item.name !== 'Neutral');

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'pie' ? (
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => [value, 'Feedback Count']} />
            <Legend />
          </PieChart>
        ) : chartType === 'bar' ? (
          <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name="Feedback Count">
              {filteredData.map((entry, index) => (
                <Cell key={`cell-bar-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={3} name="Feedback Count" />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default MySqlSentimentChart;
