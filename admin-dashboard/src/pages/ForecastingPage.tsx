/**
 * Forecasting Page
 * 
 * Main page for demand forecasting and predictive analytics
 */

import React from 'react';
import { ForecastingDashboard } from '../components/forecasting/ForecastingDashboard';

export const ForecastingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <ForecastingDashboard />
    </div>
  );
};