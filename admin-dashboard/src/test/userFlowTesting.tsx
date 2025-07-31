/**
 * User Flow Testing Component
 * 
 * This component provides comprehensive user flow testing to ensure
 * consistent navigation patterns, interaction feedback, and user experience
 * across the entire application.
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../components/providers/ThemeProvider';
import { auditUIConsistency, logAuditReport, AuditReport } from '../utils/uiConsistencyAudit';
import {
  CheckCircle,
  AlertTriangle,
  Info,
  Play,
  RotateCcw,
  Eye
} from 'lucide-react';

interface FlowStep {
  id: string;
  name: string;
  description: string;
  path: string;
  actions: FlowAction[];
  expectedElements: string[];
  validations: FlowValidation[];
}

interface FlowAction {
  type: 'click' | 'type' | 'wait' | 'navigate' | 'verify';
  selector?: string;
  value?: string;
  timeout?: number;
  description: string;
}

interface FlowValidation {
  type: 'element' | 'text' | 'class' | 'attribute' | 'accessibility';
  selector?: string;
  expected: string;
  description: string;
}

interface FlowResult {
  stepId: string;
  success: boolean;
  message: string;
  timestamp: Date;
  screenshot?: string;
  errors: string[];
}

// Define comprehensive user flows
const USER_FLOWS: FlowStep[] = [
  {
    id: 'login-flow',
    name: 'Authentication Flow',
    description: 'Complete login process from landing to dashboard',
    path: '/auth/login',
    actions: [
      {
        type: 'navigate',
        description: 'Navigate to login page'
      },
      {
        type: 'verify',
        selector: '[role="main"]',
        description: 'Verify main content is accessible'
      },
      {
        type: 'click',
        selector: 'button[type="button"]',
        description: 'Click Reddit login button'
      }
    ],
    expectedElements: [
      'h1#login-title',
      'button[type="button"]',
      '[role="img"][aria-label="Security lock icon"]'
    ],
    validations: [
      {
        type: 'element',
        selector: '.icon-xl',
        expected: 'present',
        description: 'Login icon uses correct size (xl for hero context)'
      },
      {
        type: 'class',
        selector: 'button[type="button"]',
        expected: 'bg-orange-600',
        description: 'Reddit button uses brand colors'
      },
      {
        type: 'accessibility',
        selector: 'button[type="button"]',
        expected: 'accessible-name',
        description: 'Login button has accessible name'
      }
    ]
  },
  {
    id: 'dashboard-navigation',
    name: 'Dashboard Navigation',
    description: 'Navigate through main dashboard sections',
    path: '/admin/dashboard',
    actions: [
      {
        type: 'navigate',
        description: 'Navigate to dashboard'
      },
      {
        type: 'verify',
        selector: '#dashboard-title',
        description: 'Verify dashboard title is present'
      },
      {
        type: 'click',
        selector: '[data-testid="quick-action-keywords"]',
        description: 'Click add keyword quick action'
      }
    ],
    expectedElements: [
      '#dashboard-title',
      '[role="region"][aria-label="Key performance metrics"]',
      '[role="group"][aria-labelledby="quick-actions-title"]'
    ],
    validations: [
      {
        type: 'element',
        selector: '.dashboard-card',
        expected: 'present',
        description: 'Dashboard cards use consistent styling'
      },
      {
        type: 'class',
        selector: '.quick-action-btn',
        expected: 'btn',
        description: 'Quick action buttons use button design system'
      },
      {
        type: 'accessibility',
        selector: '[role="main"]',
        expected: 'aria-label',
        description: 'Main content has proper ARIA label'
      }
    ]
  },
  {
    id: 'form-interaction',
    name: 'Form Interaction Flow',
    description: 'Test form components and validation patterns',
    path: '/admin/keywords',
    actions: [
      {
        type: 'navigate',
        description: 'Navigate to keywords page'
      },
      {
        type: 'click',
        selector: 'button[aria-label*="Add"]',
        description: 'Click add keyword button'
      },
      {
        type: 'type',
        selector: 'input[type="text"]',
        value: 'test keyword',
        description: 'Type in keyword input'
      },
      {
        type: 'verify',
        selector: '.form-state-focused',
        description: 'Verify focus state is applied'
      }
    ],
    expectedElements: [
      'input[type="text"]',
      'button[type="submit"]',
      '.form-default'
    ],
    validations: [
      {
        type: 'class',
        selector: 'input[type="text"]',
        expected: 'form-default',
        description: 'Input uses form design system'
      },
      {
        type: 'class',
        selector: 'input[type="text"]:focus',
        expected: 'form-state-focused',
        description: 'Input shows focus state'
      },
      {
        type: 'accessibility',
        selector: 'input[type="text"]',
        expected: 'accessible-name',
        description: 'Input has accessible name'
      }
    ]
  },
  {
    id: 'error-handling',
    name: 'Error Handling Flow',
    description: 'Test error states and recovery patterns',
    path: '/admin/dashboard',
    actions: [
      {
        type: 'navigate',
        description: 'Navigate to dashboard'
      },
      {
        type: 'wait',
        timeout: 2000,
        description: 'Wait for potential error states'
      },
      {
        type: 'verify',
        selector: '[role="alert"], .alert-error',
        description: 'Check for error handling patterns'
      }
    ],
    expectedElements: [
      '[role="alert"]',
      '.text-error',
      'button[aria-label*="retry"], button[aria-label*="Retry"]'
    ],
    validations: [
      {
        type: 'element',
        selector: '[role="alert"]',
        expected: 'present',
        description: 'Error messages use proper ARIA role'
      },
      {
        type: 'class',
        selector: '.alert-error',
        expected: 'border-l-error',
        description: 'Error alerts use consistent styling'
      },
      {
        type: 'accessibility',
        selector: '[role="alert"]',
        expected: 'aria-live',
        description: 'Error messages are announced to screen readers'
      }
    ]
  },
  {
    id: 'loading-states',
    name: 'Loading States Flow',
    description: 'Test loading patterns and feedback',
    path: '/admin/analytics',
    actions: [
      {
        type: 'navigate',
        description: 'Navigate to analytics page'
      },
      {
        type: 'verify',
        selector: '.loading, .animate-pulse, [aria-busy="true"]',
        description: 'Check for loading states'
      },
      {
        type: 'wait',
        timeout: 3000,
        description: 'Wait for content to load'
      }
    ],
    expectedElements: [
      '.loading-skeleton',
      '.animate-pulse',
      '[aria-busy="true"]'
    ],
    validations: [
      {
        type: 'class',
        selector: '.loading-skeleton',
        expected: 'animate-pulse',
        description: 'Loading skeletons use consistent animation'
      },
      {
        type: 'attribute',
        selector: '[aria-busy="true"]',
        expected: 'aria-busy',
        description: 'Loading states have proper ARIA attributes'
      }
    ]
  }
];

export const UserFlowTester: React.FC = () => {
  const [currentFlow, setCurrentFlow] = useState<FlowStep | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<FlowResult[]>([]);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const navigate = useNavigate();

  // Run UI consistency audit
  const runAudit = async () => {
    try {
      const report = await auditUIConsistency();
      setAuditReport(report);
      logAuditReport(report);
    } catch (error) {
      console.error('Audit failed:', error);
    }
  };

  // Execute a single flow step
  const executeFlowStep = async (flow: FlowStep, stepIndex: number): Promise<FlowResult> => {
    const action = flow.actions[stepIndex];
    const result: FlowResult = {
      stepId: `${flow.id}-${stepIndex}`,
      success: false,
      message: '',
      timestamp: new Date(),
      errors: []
    };

    try {
      switch (action.type) {
        case 'navigate':
          navigate(flow.path);
          await new Promise(resolve => setTimeout(resolve, 1000));
          result.success = true;
          result.message = `Navigated to ${flow.path}`;
          break;

        case 'click':
          if (action.selector) {
            const element = document.querySelector(action.selector);
            if (element) {
              (element as HTMLElement).click();
              result.success = true;
              result.message = `Clicked ${action.selector}`;
            } else {
              result.errors.push(`Element not found: ${action.selector}`);
            }
          }
          break;

        case 'type':
          if (action.selector && action.value) {
            const element = document.querySelector(action.selector) as HTMLInputElement;
            if (element) {
              element.value = action.value;
              element.dispatchEvent(new Event('input', { bubbles: true }));
              result.success = true;
              result.message = `Typed "${action.value}" in ${action.selector}`;
            } else {
              result.errors.push(`Input element not found: ${action.selector}`);
            }
          }
          break;

        case 'wait':
          await new Promise(resolve => setTimeout(resolve, action.timeout || 1000));
          result.success = true;
          result.message = `Waited ${action.timeout || 1000}ms`;
          break;

        case 'verify':
          if (action.selector) {
            const element = document.querySelector(action.selector);
            if (element) {
              result.success = true;
              result.message = `Verified element exists: ${action.selector}`;
            } else {
              result.errors.push(`Verification failed: ${action.selector} not found`);
            }
          }
          break;
      }

      // Run validations for this step
      const validationErrors = await runValidations(flow.validations);
      if (validationErrors.length > 0) {
        result.errors.push(...validationErrors);
        result.success = false;
      }

    } catch (error) {
      result.errors.push(`Execution error: ${error}`);
      result.success = false;
    }

    if (!result.success && result.errors.length === 0) {
      result.errors.push('Step failed for unknown reason');
    }

    return result;
  };

  // Run validations
  const runValidations = async (validations: FlowValidation[]): Promise<string[]> => {
    const errors: string[] = [];

    for (const validation of validations) {
      try {
        switch (validation.type) {
          case 'element':
            if (validation.selector) {
              const element = document.querySelector(validation.selector);
              if (validation.expected === 'present' && !element) {
                errors.push(`Element not found: ${validation.selector}`);
              } else if (validation.expected === 'absent' && element) {
                errors.push(`Element should not exist: ${validation.selector}`);
              }
            }
            break;

          case 'class':
            if (validation.selector) {
              const element = document.querySelector(validation.selector);
              if (element && !element.classList.contains(validation.expected)) {
                errors.push(`Element missing class "${validation.expected}": ${validation.selector}`);
              }
            }
            break;

          case 'attribute':
            if (validation.selector) {
              const element = document.querySelector(validation.selector);
              if (element && !element.hasAttribute(validation.expected)) {
                errors.push(`Element missing attribute "${validation.expected}": ${validation.selector}`);
              }
            }
            break;

          case 'accessibility':
            if (validation.selector) {
              const element = document.querySelector(validation.selector);
              if (element) {
                const hasAccessibleName = element.hasAttribute('aria-label') ||
                  element.hasAttribute('aria-labelledby') ||
                  element.textContent?.trim();
                if (validation.expected === 'accessible-name' && !hasAccessibleName) {
                  errors.push(`Element missing accessible name: ${validation.selector}`);
                }
              }
            }
            break;
        }
      } catch (error) {
        errors.push(`Validation error: ${error}`);
      }
    }

    return errors;
  };

  // Run complete flow
  const runFlow = async (flow: FlowStep) => {
    setCurrentFlow(flow);
    setCurrentStepIndex(0);
    setIsRunning(true);
    setResults([]);

    for (let i = 0; i < flow.actions.length; i++) {
      setCurrentStepIndex(i);
      const result = await executeFlowStep(flow, i);
      setResults(prev => [...prev, result]);

      if (!result.success) {
        console.error(`Flow step failed:`, result);
        // Continue with next step even if current fails
      }

      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  // Run all flows
  const runAllFlows = async () => {
    for (const flow of USER_FLOWS) {
      await runFlow(flow);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getResultIcon = (result: FlowResult) => {
    if (result.success) {
      return <CheckCircle className="w-4 h-4 text-success" />;
    } else {
      return <AlertTriangle className="w-4 h-4 text-error" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          UI Consistency Verification
        </h1>
        <p className="text-secondary">
          Comprehensive testing of design system application, brand guidelines, and user flows
        </p>
      </header>

      {/* Control Panel */}
      <section className="dashboard-card mb-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Test Controls</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={runAudit}
            className="btn-primary"
            disabled={isRunning}
          >
            <Eye className="w-4 h-4" />
            Run UI Audit
          </button>
          <button
            onClick={runAllFlows}
            className="btn-secondary"
            disabled={isRunning}
          >
            <Play className="w-4 h-4" />
            Run All Flows
          </button>
          <button
            onClick={() => setResults([])}
            className="btn-ghost"
          >
            <RotateCcw className="w-4 h-4" />
            Clear Results
          </button>
        </div>
      </section>

      {/* Audit Report */}
      {auditReport && (
        <section className="dashboard-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-primary">Audit Report</h2>
            <div className={`text-2xl font-bold ${getScoreColor(auditReport.summary.score)}`}>
              {auditReport.summary.score}/100
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-error">{auditReport.summary.errors}</div>
              <div className="text-sm text-secondary">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-warning">{auditReport.summary.warnings}</div>
              <div className="text-sm text-secondary">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-info">{auditReport.summary.info}</div>
              <div className="text-sm text-secondary">Info</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">{auditReport.summary.total}</div>
              <div className="text-sm text-secondary">Total Issues</div>
            </div>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn-ghost text-sm"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>

          {showDetails && (
            <div className="mt-4 space-y-4">
              {auditReport.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold text-primary mb-2">Recommendations</h3>
                  <ul className="space-y-1">
                    {auditReport.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-secondary flex items-start gap-2">
                        <Info className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-primary mb-2">Issues by Category</h3>
                <div className="space-y-2">
                  {Object.entries(
                    auditReport.results.reduce((acc, result) => {
                      if (!acc[result.category]) acc[result.category] = [];
                      acc[result.category].push(result);
                      return acc;
                    }, {} as Record<string, typeof auditReport.results>)
                  ).map(([category, issues]) => (
                    <details key={category} className="border border-primary rounded-lg">
                      <summary className="p-3 cursor-pointer hover:bg-surface-secondary">
                        <span className="font-medium">{category}</span>
                        <span className="ml-2 text-sm text-secondary">({issues.length} issues)</span>
                      </summary>
                      <div className="p-3 pt-0 space-y-2">
                        {issues.map((issue, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            {issue.severity === 'error' && <AlertTriangle className="w-4 h-4 text-error mt-0.5" />}
                            {issue.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />}
                            {issue.severity === 'info' && <Info className="w-4 h-4 text-info mt-0.5" />}
                            <div>
                              <div className="text-primary">{issue.message}</div>
                              {issue.suggestion && (
                                <div className="text-secondary mt-1">💡 {issue.suggestion}</div>
                              )}
                              {issue.requirement && (
                                <div className="text-tertiary mt-1">📋 Requirement: {issue.requirement}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Flow Tests */}
      <section className="dashboard-card mb-6">
        <h2 className="text-xl font-semibold text-primary mb-4">User Flow Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {USER_FLOWS.map((flow) => (
            <div key={flow.id} className="border border-primary rounded-lg p-4">
              <h3 className="font-semibold text-primary mb-2">{flow.name}</h3>
              <p className="text-sm text-secondary mb-4">{flow.description}</p>
              <button
                onClick={() => runFlow(flow)}
                className="btn-secondary w-full text-sm"
                disabled={isRunning}
              >
                <Play className="w-4 h-4" />
                Run Flow
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Current Flow Status */}
      {currentFlow && isRunning && (
        <section className="dashboard-card mb-6">
          <h2 className="text-xl font-semibold text-primary mb-4">
            Running: {currentFlow.name}
          </h2>
          <div className="space-y-2">
            {currentFlow.actions.map((action, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-2 rounded ${index === currentStepIndex ? 'bg-primary/20' :
                    index < currentStepIndex ? 'bg-success/20' : 'bg-surface-secondary'
                  }`}
              >
                {index < currentStepIndex ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : index === currentStepIndex ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-4 h-4 border border-tertiary rounded-full" />
                )}
                <span className="text-sm">{action.description}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      {results.length > 0 && (
        <section className="dashboard-card">
          <h2 className="text-xl font-semibold text-primary mb-4">Test Results</h2>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border ${result.success ? 'border-success bg-success/10' : 'border-error bg-error/10'
                  }`}
              >
                {getResultIcon(result)}
                <div className="flex-1">
                  <div className="font-medium text-primary">{result.message}</div>
                  <div className="text-xs text-tertiary">
                    {result.timestamp.toLocaleTimeString()}
                  </div>
                  {result.errors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {result.errors.map((error, errorIndex) => (
                        <div key={errorIndex} className="text-sm text-error">
                          • {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// Wrapper component with providers
export const UserFlowTestingApp: React.FC = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <UserFlowTester />
        </ThemeProvider>
      </QueryClientProvider>
    </Router>
  );
};

export default UserFlowTestingApp;