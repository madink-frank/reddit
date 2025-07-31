import React, { useState } from 'react';
import { BarChart, BarChartData, ChartContainer, generateColors } from './index';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

interface KeywordFrequencyData {
  keyword: string;
  frequency: number;
  posts: number;
  trend?: 'up' | 'down' | 'stable';
}

interface KeywordFrequencyChartProps {
  data: KeywordFrequencyData[];
  title?: string;
  className?: string;
  height?: number;
  isLoading?: boolean;
  error?: string;
  maxItems?: number;
  sortBy?: 'frequency' | 'posts' | 'keyword';
  onSort?: (sortBy: string) => void;
}

export const KeywordFrequencyChart: React.FC<KeywordFrequencyChartProps> = ({
  data,
  title = "키워드별 언급 빈도",
  className = '',
  height = 400,
  isLoading = false,
  error,
  maxItems = 10,
  sortBy = 'frequency',
  onSort,
}) => {
  const [currentSortBy, setCurrentSortBy] = useState(sortBy);
  const [showHorizontal, setShowHorizontal] = useState(true);

  // Sort and limit data
  const sortedData = [...data]
    .sort((a, b) => {
      switch (currentSortBy) {
        case 'frequency':
          return b.frequency - a.frequency;
        case 'posts':
          return b.posts - a.posts;
        case 'keyword':
          return a.keyword.localeCompare(b.keyword);
        default:
          return 0;
      }
    })
    .slice(0, maxItems);

  const colors = generateColors(sortedData.length);

  const chartData: BarChartData = {
    labels: sortedData.map(item => item.keyword),
    datasets: [
      {
        label: '언급 빈도',
        data: sortedData.map(item => item.frequency),
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };

  const handleSortChange = (newSortBy: string) => {
    setCurrentSortBy(newSortBy);
    onSort?.(newSortBy);
  };

  const toggleOrientation = () => {
    setShowHorizontal(!showHorizontal);
  };

  const sortOptions = [
    { value: 'frequency', label: '언급 빈도순' },
    { value: 'posts', label: '포스트 수순' },
    { value: 'keyword', label: '키워드명순' },
  ];

  const actions = (
    <div className="flex items-center space-x-2">
      <Select
        value={currentSortBy}
        onChange={handleSortChange}
        options={sortOptions}
        className="w-32"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={toggleOrientation}
      >
        {showHorizontal ? '세로형' : '가로형'}
      </Button>
    </div>
  );

  return (
    <div className={className}>
      <ChartContainer
        title={title}
        isLoading={isLoading}
        error={error}
        actions={actions}
      >
        <div className="space-y-4">
          <BarChart
            data={chartData}
            height={height}
            horizontal={showHorizontal}
          />

          {/* Keyword Stats Table */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              상세 통계
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      키워드
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      언급 빈도
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      포스트 수
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      트렌드
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedData.map((item, index) => (
                    <tr key={item.keyword} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: colors[index] }}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.keyword}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.frequency.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.posts.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {item.trend && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.trend === 'up' 
                              ? 'bg-green-100 text-green-800' 
                              : item.trend === 'down'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.trend === 'up' && '↗️ 상승'}
                            {item.trend === 'down' && '↘️ 하락'}
                            {item.trend === 'stable' && '→ 안정'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ChartContainer>
    </div>
  );
};