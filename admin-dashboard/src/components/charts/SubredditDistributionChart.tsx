import React, { useState } from 'react';
import { PieChart, PieChartData, ChartContainer, generateColors } from './index';
import { Button } from '../ui/Button';

interface SubredditData {
  subreddit: string;
  postCount: number;
  percentage: number;
  avgScore: number;
  totalComments: number;
}

interface SubredditDistributionChartProps {
  data: SubredditData[];
  title?: string;
  className?: string;
  height?: number;
  isLoading?: boolean;
  error?: string;
  variant?: 'pie' | 'doughnut';
  maxItems?: number;
}

export const SubredditDistributionChart: React.FC<SubredditDistributionChartProps> = ({
  data,
  title = "서브레딧 분포",
  className = '',
  height = 400,
  isLoading = false,
  error,
  variant = 'doughnut',
  maxItems = 10,
}) => {
  const [showTable, setShowTable] = useState(false);

  // Sort by post count and limit
  const sortedData = [...data]
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, maxItems);

  // Group smaller subreddits into "Others"
  const threshold = 0.02; // 2% threshold
  const mainData = sortedData.filter(item => item.percentage >= threshold);
  const otherData = sortedData.filter(item => item.percentage < threshold);
  
  const finalData = [...mainData];
  if (otherData.length > 0) {
    const othersTotal = otherData.reduce((sum, item) => sum + item.postCount, 0);
    const othersPercentage = otherData.reduce((sum, item) => sum + item.percentage, 0);
    finalData.push({
      subreddit: 'Others',
      postCount: othersTotal,
      percentage: othersPercentage,
      avgScore: otherData.reduce((sum, item) => sum + item.avgScore, 0) / otherData.length,
      totalComments: otherData.reduce((sum, item) => sum + item.totalComments, 0),
    });
  }

  const colors = generateColors(finalData.length);

  const chartData: PieChartData = {
    labels: finalData.map(item => item.subreddit),
    datasets: [
      {
        data: finalData.map(item => item.postCount),
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 2,
      },
    ],
  };

  const toggleTable = () => {
    setShowTable(!showTable);
  };

  const actions = (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTable}
    >
      {showTable ? '차트 보기' : '테이블 보기'}
    </Button>
  );

  return (
    <div className={className}>
      <ChartContainer
        title={title}
        isLoading={isLoading}
        error={error}
        actions={actions}
      >
        {!showTable ? (
          <div className="space-y-4">
            <PieChart
              data={chartData}
              height={height}
              variant={variant}
              showPercentage={true}
            />
            
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  총 서브레딧 수
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.reduce((sum, item) => sum + item.postCount, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  총 포스트 수
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(data.reduce((sum, item) => sum + item.avgScore, 0) / data.length)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  평균 점수
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    서브레딧
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    포스트 수
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    비율
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    평균 점수
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    총 댓글 수
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedData.map((item, index) => (
                  <tr key={item.subreddit} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: colors[index] || colors[0] }}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          r/{item.subreddit}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.postCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.percentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {Math.round(item.avgScore)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.totalComments.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartContainer>
    </div>
  );
};