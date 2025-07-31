/**
 * Business Intelligence Page
 * 
 * Main page for business intelligence dashboard with executive insights
 */

import React from 'react';
import { BusinessIntelligenceDashboard } from '../components/business-intelligence/BusinessIntelligenceDashboard';

export const BusinessIntelligencePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <BusinessIntelligenceDashboard />
    </div>
  );
};