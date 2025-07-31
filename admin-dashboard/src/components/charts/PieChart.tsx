import React from 'react';
import { Pie, Doughnut } from 'react-chartjs-2';
import { BaseChartProps, chartOptions, darkChartOptions } from './BaseChart';

export interface PieChartData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

interface PieChartProps extends BaseChartProps {
  data: PieChartData;
  isDark?: boolean;
  variant?: 'pie' | 'doughnut';
  showPercentage?: boolean;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  className = '',
  height = 300,
  isDark = false,
  variant = 'pie',
  showPercentage = true,
}) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
          color: isDark ? '#e5e7eb' : '#374151',
        },
      },
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
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return showPercentage ? `${label}: ${value} (${percentage}%)` : `${label}: ${value}`;
          }
        }
      },
    },
  };

  const ChartComponent = variant === 'doughnut' ? Doughnut : Pie;

  return (
    <div className={`w-full ${className}`}>
      <div style={{ height: `${height}px` }}>
        <ChartComponent data={data} options={options} />
      </div>
    </div>
  );
};