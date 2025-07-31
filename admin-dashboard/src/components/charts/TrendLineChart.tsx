import React, { useState } from 'react';
import { LineChart, LineChartData, ChartContainer, chartColors, generateColors } from './index';
import { Button } from '../ui/Button';

interface TrendData {
  date: string;
  value: number;
  keyword?: string;
}

interface TrendLineChartProps {
  data: TrendData[];
  title?: string;
  keywords?: string[];
  className?: string;
  height?: number;
  isLoading?: boolean;
  error?: string;
  onZoom?: (startDate: string, endDate: string) => void;
  onFilter?: (keywords: string[]) => void;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  title = "시간대별 트렌드 변화",
  keywords = [],
  className = '',
  height = 400,
  isLoading = false,
  error,
  onZoom,
  onFilter,
}) => {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(keywords);
  const [zoomMode, setZoomMode] = useState(false);

  // Group data by keyword
  const groupedData = data.reduce((acc, item) => {
    const keyword = item.keyword || 'All';
    if (!acc[keyword]) {
      acc[keyword] = [];
    }
    acc[keyword].push(item);
    return acc;
  }, {} as Record<string, TrendData[]>);

  // Get unique dates for labels
  const dates = [...new Set(data.map(item => item.date))].sort();
  
  // Generate chart data
  const chartData: LineChartData = {
    labels: dates,
    datasets: Object.entries(groupedData)
      .filter(([keyword]) => selectedKeywords.length === 0 || selectedKeywords.includes(keyword))
      .map(([keyword, items], index) => {
        const colors = generateColors(Object.keys(groupedData).length);
        const dataPoints = dates.map(date => {
          const item = items.find(i => i.date === date);
          return item ? item.value : 0;
        });

        return {
          label: keyword,
          data: dataPoints,
          borderColor: colors[index],
          backgroundColor: colors[index] + '20',
          fill: false,
          tension: 0.4,
        };
      }),
  };

  const handleKeywordToggle = (keyword: string) => {
    const newSelected = selectedKeywords.includes(keyword)
      ? selectedKeywords.filter(k => k !== keyword)
      : [...selectedKeywords, keyword];
    
    setSelectedKeywords(newSelected);
    onFilter?.(newSelected);
  };

  const toggleZoomMode = () => {
    setZoomMode(!zoomMode);
  };

  const resetFilters = () => {
    setSelectedKeywords([]);
    onFilter?.([]);
  };

  const actions = (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleZoomMode}
        className={zoomMode ? 'bg-blue-50 border-blue-300' : ''}
      >
        {zoomMode ? '줌 해제' : '줌 모드'}
      </Button>
      {selectedKeywords.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
        >
          필터 초기화
        </Button>
      )}
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
          {/* Keyword Filter Buttons */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {keywords.map(keyword => (
                <button
                  key={keyword}
                  onClick={() => handleKeywordToggle(keyword)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    selectedKeywords.includes(keyword)
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {keyword}
                </button>
              ))}
            </div>
          )}

          {/* Chart */}
          <LineChart
            data={chartData}
            height={height}
            showArea={true}
          />

          {/* Zoom Instructions */}
          {zoomMode && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              💡 차트를 드래그하여 특정 기간을 확대할 수 있습니다.
            </div>
          )}
        </div>
      </ChartContainer>
    </div>
  );
};