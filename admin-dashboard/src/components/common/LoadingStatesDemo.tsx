/**
 * Loading States Demo Component
 * 
 * Demonstrates the improved loading system according to task 11
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { 
  LoadingOverlay,
  InlineLoading,
  LoadingButton,
  ProgressiveLoading,
  SmartLoading
} from '../ui/LoadingComponents';
import { 
  LoadingSpinner,
  ProgressBar,
  EnhancedSkeleton} from '../ui/LoadingSystem';
import { useLoadingState, useProgressiveLoading } from '../../hooks/useLoadingState';

export const LoadingStatesDemo: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [inlineLoading, setInlineLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [smartLoading, setSmartLoading] = useState(false);
  const [progress, setProgress] = useState(0);


  const progressiveLoading = useProgressiveLoading([
    'Initializing...',
    'Loading data...',
    'Processing results...',
    'Finalizing...'
  ]);

  const simulateLoading = (setter: (value: boolean) => void, duration = 3000) => {
    setter(true);
    setTimeout(() => setter(false), duration);
  };

  const simulateProgressiveLoading = () => {
    progressiveLoading.startLoading();
    
    const stages = [
      { delay: 1000, progress: 25 },
      { delay: 2000, progress: 50 },
      { delay: 3000, progress: 75 },
      { delay: 4000, progress: 100 }
    ];

    stages.forEach(({ delay, progress }, index) => {
      setTimeout(() => {
        progressiveLoading.updateStageProgress(progress);
        if (index < stages.length - 1) {
          setTimeout(() => progressiveLoading.nextStage(), 500);
        } else {
          setTimeout(() => progressiveLoading.reset(), 1000);
        }
      }, delay);
    });
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Enhanced Loading States Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Showcasing improved loading components with time-based feedback
        </p>
      </div>

      {/* Loading Spinners */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Spinners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
            <div className="text-center">
              <LoadingSpinner size="xs" />
              <p className="text-sm mt-2">Extra Small</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="sm" />
              <p className="text-sm mt-2">Small</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="md" />
              <p className="text-sm mt-2">Medium</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-sm mt-2">Large</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="xl" />
              <p className="text-sm mt-2">Extra Large</p>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <LoadingSpinner size="md" color="primary" />
              <p className="text-sm mt-2">Primary</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="md" color="success" />
              <p className="text-sm mt-2">Success</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="md" color="warning" />
              <p className="text-sm mt-2">Warning</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="md" color="error" />
              <p className="text-sm mt-2">Error</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="md" color="secondary" />
              <p className="text-sm mt-2">Secondary</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Bars</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <ProgressBar value={25} showPercentage />
            <p className="text-sm text-gray-600 mt-1">Default Progress</p>
          </div>
          <div>
            <ProgressBar value={60} variant="success" showPercentage />
            <p className="text-sm text-gray-600 mt-1">Success Progress</p>
          </div>
          <div>
            <ProgressBar value={80} variant="warning" showPercentage />
            <p className="text-sm text-gray-600 mt-1">Warning Progress</p>
          </div>
          <div>
            <ProgressBar value={progress} showPercentage animated />
            <p className="text-sm text-gray-600 mt-1">Animated Progress</p>
            <Button onClick={simulateProgress} size="sm" className="mt-2">
              Simulate Progress
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Skeletons */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Skeletons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Shimmer Animation</h4>
            <div className="space-y-2">
              <EnhancedSkeleton height={20} width="80%" animation="shimmer" />
              <EnhancedSkeleton height={16} width="60%" animation="shimmer" />
              <EnhancedSkeleton height={16} width="70%" animation="shimmer" />
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Different Variants</h4>
            <div className="flex items-center space-x-4">
              <EnhancedSkeleton height={40} width={40} variant="circular" animation="shimmer" />
              <div className="flex-1 space-y-2">
                <EnhancedSkeleton height={16} width="75%" animation="shimmer" />
                <EnhancedSkeleton height={14} width="50%" animation="shimmer" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Multi-line Text</h4>
            <EnhancedSkeleton lines={4} animation="shimmer" />
          </div>
        </CardContent>
      </Card>

      {/* Loading Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Buttons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <LoadingButton
              isLoading={buttonLoading}
              loadingText="Processing..."
              onClick={() => simulateLoading(setButtonLoading)}
            >
              Primary Button
            </LoadingButton>
            
            <LoadingButton
              isLoading={buttonLoading}
              variant="secondary"
              onClick={() => simulateLoading(setButtonLoading)}
            >
              Secondary Button
            </LoadingButton>
            
            <LoadingButton
              isLoading={buttonLoading}
              variant="outline"
              onClick={() => simulateLoading(setButtonLoading)}
            >
              Outline Button
            </LoadingButton>
          </div>
        </CardContent>
      </Card>

      {/* Inline Loading */}
      <Card>
        <CardHeader>
          <CardTitle>Inline Loading States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Card Skeleton</h4>
              <InlineLoading
                isLoading={inlineLoading}
                skeleton="card"
              >
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Sample Card</h3>
                  <p className="text-gray-600">This is sample content that would be shown when not loading.</p>
                  <div className="flex space-x-2 mt-4">
                    <Button size="sm">Action 1</Button>
                    <Button size="sm" variant="outline">Action 2</Button>
                  </div>
                </div>
              </InlineLoading>
              <Button 
                onClick={() => simulateLoading(setInlineLoading)} 
                size="sm" 
                className="mt-2"
              >
                Toggle Loading
              </Button>
            </div>

            <div>
              <h4 className="font-medium mb-3">List Skeleton</h4>
              <InlineLoading
                isLoading={inlineLoading}
                skeleton="list"
              >
                <div className="space-y-3">
                  {['Item 1', 'Item 2', 'Item 3'].map((item, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item}</p>
                        <p className="text-sm text-gray-600">Sample description</p>
                      </div>
                    </div>
                  ))}
                </div>
              </InlineLoading>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progressive Loading */}
      <Card>
        <CardHeader>
          <CardTitle>Progressive Loading</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md mx-auto">
            {progressiveLoading.isLoading ? (
              <ProgressiveLoading
                stages={['Initializing...', 'Loading data...', 'Processing results...', 'Finalizing...']}
                currentStage={progressiveLoading.currentStage}
                stageProgress={progressiveLoading.stageProgress}
                overallProgress={progressiveLoading.progress}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Progressive loading demo</p>
                <Button onClick={simulateProgressiveLoading}>
                  Start Progressive Loading
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Smart Loading with Time-based Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Loading (Time-based Feedback)</CardTitle>
        </CardHeader>
        <CardContent>
          <SmartLoading isLoading={smartLoading}>
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">Content Loaded!</h3>
              <p className="text-gray-600">This content appears after loading completes.</p>
            </div>
          </SmartLoading>
          
          <div className="mt-4 text-center">
            <Button 
              onClick={() => simulateLoading(setSmartLoading, 8000)}
              disabled={smartLoading}
            >
              Test Smart Loading (8s)
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              Watch how the loading message changes over time
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Loading Overlay */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Overlay</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <Button onClick={() => simulateLoading(setShowOverlay, 3000)}>
              Show Loading Overlay
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              Full-screen loading overlay with backdrop
            </p>
          </div>
        </CardContent>
      </Card>

      <LoadingOverlay
        isLoading={showOverlay}
        message="Processing your request..."
        backdrop="blur"
      />
    </div>
  );
};

export default LoadingStatesDemo;