import React from 'react';
import { Bar } from 'react-chartjs-2';
import { BaseChartProps, chartOptions, darkChartOptions } from './BaseChart';

export interface BarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

interface BarChartProps extends BaseChartProps {
  data: BarChartData;
  isDark?: boolean;
  horizontal?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  className = '',
  height = 300,
  isDark = false,
  horizontal = false,
}) => {
  const options = {
    ...(isDark ? darkChartOptions : chartOptions),
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
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
    scales: {
      x: {
        ...(isDark ? darkChartOptions : chartOptions).scales.x,
        beginAtZero: true,
      },
      y: {
        ...(isDark ? darkChartOptions : chartOptions).scales.y,
        beginAtZero: true,
      },
    },
  };

  return (
    <div className={`w-full ${className}`}>
      <div style={{ height: `${height}px` }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};