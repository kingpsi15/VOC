import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Minimal outlined SVG icons for chart types
const LineIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,17 8,8 13,13 17,7" />
    <circle cx="17" cy="7" r="1.5" fill="currentColor" />
  </svg>
);
const BarIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="10" width="3" height="7" rx="1" />
    <rect x="8.5" y="6" width="3" height="11" rx="1" />
    <rect x="14" y="13" width="3" height="4" rx="1" />
  </svg>
);
const AreaIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,17 8,8 13,13 17,7" fill="none" />
    <polygon points="3,17 8,8 13,13 17,7 17,17 3,17" fill="currentColor" fillOpacity="0.1" />
  </svg>
);

const chartTypes = [
  { key: 'line', label: 'Line', icon: LineIcon },
  { key: 'bar', label: 'Bar', icon: BarIcon },
  { key: 'area', label: 'Area', icon: AreaIcon },
];

const EmployeePerformanceChart = () => {
  const [chartType, setChartType] = useState('line');
  const data = [
    {
      month: 'Jan',
      avgRating: 4.1,
      resolutionRate: 78,
      responseTime: 3.2
    },
    {
      month: 'Feb',
      avgRating: 4.2,
      resolutionRate: 81,
      responseTime: 2.9
    },
    {
      month: 'Mar',
      avgRating: 4.0,
      resolutionRate: 79,
      responseTime: 3.1
    },
    {
      month: 'Apr',
      avgRating: 4.3,
      resolutionRate: 85,
      responseTime: 2.6
    },
    {
      month: 'May',
      avgRating: 4.2,
      resolutionRate: 83,
      responseTime: 2.4
    }
  ];

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="avgRating" fill="#3B82F6" name="Avg Rating" />
            <Bar dataKey="resolutionRate" fill="#10B981" name="Resolution Rate (%)" />
            <Bar dataKey="responseTime" fill="#F59E0B" name="Response Time (hrs)" />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="avgRating" stroke="#3B82F6" fill="#3B82F6" name="Avg Rating" />
            <Area type="monotone" dataKey="resolutionRate" stroke="#10B981" fill="#10B981" name="Resolution Rate (%)" />
            <Area type="monotone" dataKey="responseTime" stroke="#F59E0B" fill="#F59E0B" name="Response Time (hrs)" />
          </AreaChart>
        );
      case 'line':
      default:
        return (
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgRating" stroke="#3B82F6" strokeWidth={3} name="Avg Rating" />
            <Line type="monotone" dataKey="resolutionRate" stroke="#10B981" strokeWidth={3} name="Resolution Rate (%)" />
            <Line type="monotone" dataKey="responseTime" stroke="#F59E0B" strokeWidth={3} name="Response Time (hrs)" />
          </LineChart>
        );
    }
  };

  return (
    <div className="h-80 relative py-14">
      {/* Chart Type Selector */}
      <div className="absolute top-2 left-2 z-10 bg-white rounded-lg shadow p-1 flex gap-1 border border-blue-200">
        {chartTypes.map(type => (
          <button
            key={type.key}
            className={`p-2 rounded transition-colors ${chartType === type.key ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-500'}`}
            onClick={() => setChartType(type.key)}
            aria-label={type.label}
            type="button"
          >
            {type.icon}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default EmployeePerformanceChart;
