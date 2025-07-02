
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RatingDistribution = () => {
  const data = [
    { rating: '1', count: 156, label: 'Very Poor' },
    { rating: '2', count: 234, label: 'Poor' },
    { rating: '3', count: 502, label: 'Average' },
    { rating: '4', count: 1203, label: 'Good' },
    { rating: '5', count: 752, label: 'Excellent' }
  ];

  const getBarColor = (rating: string) => {
    switch (rating) {
      case '1': return '#DC2626';
      case '2': return '#EA580C';
      case '3': return '#D97706';
      case '4': return '#059669';
      case '5': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="rating" 
            tick={{ fontSize: 12 }}
            label={{ value: 'Rating', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: any, name: any, props: any) => [value, `${props.payload.label} (${props.payload.rating}★)`]}
            labelFormatter={(label) => `Rating: ${label}★`}
          />
          <Bar dataKey="count">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.rating)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RatingDistribution;
