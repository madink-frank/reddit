import React, { useState } from 'react';
import { Button } from './Button';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  disabled?: boolean;
  presets?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
  presets = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePresetClick = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    onChange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
    setIsOpen(false);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', dateValue: string) => {
    onChange({
      ...value,
      [field]: dateValue,
    });
  };

  const presetOptions = [
    { label: '오늘', days: 0 },
    { label: '어제', days: 1 },
    { label: '지난 7일', days: 7 },
    { label: '지난 30일', days: 30 },
    { label: '지난 90일', days: 90 },
    { label: '지난 1년', days: 365 },
  ];

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-between"
      >
        <span>
          {value.startDate && value.endDate
            ? `${formatDate(value.startDate)} - ${formatDate(value.endDate)}`
            : '날짜 범위 선택'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4 space-y-4">
            {/* Custom Date Range */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                사용자 정의 범위
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={value.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={value.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Preset Options */}
            {presets && (
              <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  빠른 선택
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {presetOptions.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetClick(preset.days)}
                      className="px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 border-t border-gray-200 dark:border-gray-700 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                적용
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};