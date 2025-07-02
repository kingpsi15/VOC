
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TimelineChart = () => {
  const data = [
    { month: 'Jan 2025', positive: 412, negative: 189, avgRating: 3.8 },
    { month: 'Feb 2025', positive: 445, negative: 201, avgRating: 3.9 },
    { month: 'Mar 2025', positive: 478, negative: 176, avgRating: 4.1 },
    { month: 'Apr 2025', positive: 523, negative: 165, avgRating: 4.2 },
    { month: 'May 2025', positive: 567, negative: 148, avgRating: 4.3 }
  ];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="positive" 
            stroke="#10B981" 
            strokeWidth={3}
            name="Positive Feedback"
          />
          <Line 
            type="monotone" 
            dataKey="negative" 
            stroke="#EF4444" 
            strokeWidth={3}
            name="Negative Feedback"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimelineChart;
