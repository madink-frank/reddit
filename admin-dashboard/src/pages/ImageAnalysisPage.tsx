import React from 'react';
import { ImageAnalysisHub } from '../components/image-analysis';

const ImageAnalysisPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ImageAnalysisHub />
    </div>
  );
};

export default ImageAnalysisPage;