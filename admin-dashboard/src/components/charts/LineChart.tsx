import React from 'react';
import { Line } from 'react-chartjs-2';
import { BaseChartProps, chartOptions, darkChartOptions } from './BaseChart';

export interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor?: string;
    fill?: boolean;
    tension?: number;
  }[];
}

interface LineChartProps extends BaseChartProps {
  data: LineChartData;
  isDark?: boolean;
  showArea?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  className = '',
  height = 300,
  isDark = false,
  showArea = false,
}) => {
  const options = {
    ...(isDark ? darkChartOptions : chartOptions),
    plugins: {
      ...(isDark ? darkChartOptions : chartOptions).plugins,
      title: {
        display: !!title,
        text: title,
        color: isDark ? '#e5e7eb' : '#374151',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  };

  const chartData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      fill: showArea ? 'origin' : false,
      tension: dataset.tension ?? 0.4,
    })),
  };

  return (
    <div className={`w-full ${className}`}>
      <div style={{ height: `${height}px` }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};