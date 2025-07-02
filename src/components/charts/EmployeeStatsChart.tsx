import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services';

interface EmployeeStatsChartProps {
  filters?: any;
  chartType?: 'bar' | 'line' | 'pie';
}

const EmployeeStatsChart: React.FC<EmployeeStatsChartProps> = ({ filters = {}, chartType = 'bar' }) => {
  // Fetch employee statistics from database
  const { data: employeeStats = [], isLoading, error } = useQuery({
    queryKey: ['employee-stats', filters],
    queryFn: () => employeeService.getEmployeeStats(filters),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-gray-500">Loading employee data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-red-500">Failed to load employee data</div>
      </div>
    );
  }

  if (!employeeStats || employeeStats.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-gray-500">No employee data available</div>
      </div>
    );
  }

  const getBarColor = (index: number) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
    return colors[index % colors.length];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1">
            <p className="text-sm text-blue-600">
              <span className="font-medium">Department:</span> {data.department}
            </p>
            <p className="text-sm text-green-600">
              <span className="font-medium">Branch:</span> {data.branch_location}
            </p>
            <p className="text-sm text-orange-600">
              <span className="font-medium">Total Interactions:</span> {data.interactions_handled || 0}
            </p>
            <p className="text-sm text-indigo-600">
              <span className="font-medium">Avg Rating:</span>{' '}
              {typeof data.avg_rating === 'number'
                ? data.avg_rating.toFixed(1)
                : !isNaN(parseFloat(data.avg_rating))
                  ? parseFloat(data.avg_rating).toFixed(1)
                  : 'N/A'}

            </p>
            <p className="text-sm text-green-600">
              <span className="font-medium">Resolved:</span> {data.resolved_count || 0}
            </p>
            <p className="text-sm text-purple-600">
              <span className="font-medium">Contacted:</span> {data.contacted_count || 0}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart 
              data={employeeStats} 
              margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, textAnchor: 'end' }}
                height={100}
                interval={0}
                angle={-45}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Interaction Count', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="interactions_handled" name="Total Interactions">
                {employeeStats.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                ))}
              </Bar>
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart 
              data={employeeStats} 
              margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, textAnchor: 'end' }}
                height={100}
                interval={0}
                angle={-45}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Interaction Count', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="interactions_handled" stroke="#3B82F6" strokeWidth={3} name="Total Interactions" />
            </LineChart>
          ) : (
            <PieChart>
              <Pie
                data={employeeStats}
                dataKey="interactions_handled"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {employeeStats.map((entry: any, index: number) => (
                  <Cell key={`cell-pie-${index}`} fill={getBarColor(index)} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Employee Performance Summary */}
      <div className="mt-4">
        <h4 className="text-lg font-semibold mb-3">Employee Performance Summary</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {employeeStats.map((employee: any, index: number) => {
            const resolutionRate = employee.interactions_handled> 0 ? 
              ((employee.resolved_count / employee.interactions_handled) * 100).toFixed(1) : '0';
            
            return (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                  <p className="text-xs text-gray-500">{employee.department} - {employee.branch_location}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-blue-600">{employee.interactions_handled || 0} interactions</span>
                  <span className="text-xs text-green-600">{resolutionRate}% resolved</span>
                  <span className="text-xs text-orange-600">
                    ★ {typeof employee.avg_rating === 'number' 
                        ? employee.avg_rating.toFixed(1) 
                        : (parseFloat(employee.avg_rating) 
                            ? parseFloat(employee.avg_rating).toFixed(1) 
                            : 'N/A')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EmployeeStatsChart;
