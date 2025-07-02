
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LocationChart = () => {
  const data = [
    { location: 'Kuala Lumpur', positive: 423, negative: 167, avgRating: 4.1 },
    { location: 'Selangor', positive: 356, negative: 189, avgRating: 3.8 },
    { location: 'Penang', positive: 298, negative: 145, avgRating: 4.0 },
    { location: 'Johor Bahru', positive: 234, negative: 123, avgRating: 3.9 },
    { location: 'Melaka', positive: 189, negative: 98, avgRating: 4.2 },
    { location: 'Ipoh', positive: 167, negative: 87, avgRating: 4.0 },
    { location: 'Kota Kinabalu', positive: 145, negative: 76, avgRating: 3.7 }
  ];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="location" 
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value: any, name: any, props: any) => {
              if (name === 'positive') return [value, 'Positive Feedback'];
              if (name === 'negative') return [value, 'Negative Feedback'];
              return [value, name];
            }}
            labelFormatter={(label) => `Location: ${label}`}
          />
          <Bar dataKey="positive" fill="#10B981" name="positive" />
          <Bar dataKey="negative" fill="#EF4444" name="negative" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LocationChart;
