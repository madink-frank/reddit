/**
 * Privacy Protection Panel
 * 
 * Provides privacy controls and data protection features
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  UserX,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Settings,
  Info,
  Clock,
  Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { PrivacyProtection } from '../../utils/accessControl';

interface PrivacySettings {
  dataRetentionDays: number;
  anonymizeAnalytics: boolean;
  redactSensitiveInfo: boolean;
  enableDataExport: boolean;
  allowDataDeletion: boolean;
  logDataAccess: boolean;
  encryptStoredData: boolean;
  requireConsentForAnalytics: boolean;
}

interface DataCategory {
  id: string;
  name: string;
  description: string;
  dataTypes: string[];
  retentionPeriod: number;
  isPersonalData: boolean;
  canBeAnonymized: boolean;
  canBeDeleted: boolean;
}

interface ConsentRecord {
  id: string;
  userId: string;
  category: string;
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
  version: string;
}

export const PrivacyProtectionPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    dataRetentionDays: 90,
    anonymizeAnalytics: true,
    redactSensitiveInfo: true,
    enableDataExport: true,
    allowDataDeletion: true,
    logDataAccess: true,
    encryptStoredData: true,
    requireConsentForAnalytics: false
  });

  const [dataCategories] = useState<DataCategory[]>([
    {
      id: 'user-data',
      name: 'User Data',
      description: 'Personal information and account details',
      dataTypes: ['email', 'name', 'preferences', 'login_history'],
      retentionPeriod: 365,
      isPersonalData: true,
      canBeAnonymized: true,
      canBeDeleted: true
    },
    {
      id: 'analysis-data',
      name: 'Analysis Data',
      description: 'NLP and image analysis results',
      dataTypes: ['text_analysis', 'sentiment_scores', 'image_analysis'],
      retentionPeriod: 180,
      isPersonalData: false,
      canBeAnonymized: true,
      canBeDeleted: true
    },
    {
      id: 'usage-data',
      name: 'Usage Data',
      description: 'Platform usage statistics and metrics',
      dataTypes: ['page_views', 'feature_usage', 'performance_metrics'],
      retentionPeriod: 90,
      isPersonalData: false,
      canBeAnonymized: true,
      canBeDeleted: false
    },
    {
      id: 'billing-data',
      name: 'Billing Data',
      description: 'Payment and billing information',
      dataTypes: ['transactions', 'invoices', 'payment_methods'],
      retentionPeriod: 2555, // 7 years for legal compliance
      isPersonalData: true,
      canBeAnonymized: false,
      canBeDeleted: false
    }
  ]);

  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [isDataExportModalOpen, setIsDataExportModalOpen] = useState(false);
  const [isDataDeletionModalOpen, setIsDataDeletionModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [deletionProgress, setDeletionProgress] = useState(0);

  // Mock consent records
  useEffect(() => {
    const mockConsents: ConsentRecord[] = [
      {
        id: 'consent-1',
        userId: 'user-123',
        category: 'analytics',
        granted: true,
        timestamp: new Date('2024-01-15'),
        ipAddress: '192.168.1.100',
        version: '1.0'
      },
      {
        id: 'consent-2',
        userId: 'user-123',
        category: 'marketing',
        granted: false,
        timestamp: new Date('2024-01-15'),
        ipAddress: '192.168.1.100',
        version: '1.0'
      }
    ];
    setConsentRecords(mockConsents);
  }, []);

  // Handle settings change
  const handleSettingChange = (key: keyof PrivacySettings, value: boolean | number) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Export user data
  const handleDataExport = async () => {
    setIsDataExportModalOpen(true);
    setExportProgress(0);

    // Simulate export process
    const steps = [
      'Collecting user data...',
      'Anonymizing sensitive information...',
      'Generating export file...',
      'Preparing download...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setExportProgress(((i + 1) / steps.length) * 100);
    }

    // Create mock export data
    const exportData = {
      user: {
        id: 'user-123',
        email: '[EMAIL_REDACTED]',
        name: 'John Doe',
        createdAt: '2024-01-01T00:00:00Z'
      },
      analysisHistory: [
        {
          id: 'analysis-1',
          type: 'sentiment',
          timestamp: '2024-01-15T10:00:00Z',
          result: 'positive'
        }
      ],
      usageStats: {
        totalAnalyses: 25,
        lastLogin: '2024-01-20T15:30:00Z'
      }
    };

    // Download the file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);

    setTimeout(() => {
      setIsDataExportModalOpen(false);
      setExportProgress(0);
    }, 1000);
  };

  // Delete user data
  const handleDataDeletion = async (categories: string[]) => {
    setIsDataDeletionModalOpen(true);
    setDeletionProgress(0);

    // Simulate deletion process
    for (let i = 0; i < categories.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setDeletionProgress(((i + 1) / categories.length) * 100);
    }

    setTimeout(() => {
      setIsDataDeletionModalOpen(false);
      setDeletionProgress(0);
    }, 1000);
  };

  // Check if text contains PII
  const checkForPII = (text: string) => {
    return PrivacyProtection.containsPII(text);
  };

  // Redact sensitive information
  const redactText = (text: string) => {
    return PrivacyProtection.redactSensitiveInfo(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-primary">Privacy Protection</h2>
            <p className="text-sm text-secondary">
              Manage data privacy settings and user rights
            </p>
          </div>
        </div>

        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          GDPR Compliant
        </Badge>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Privacy Settings</TabsTrigger>
          <TabsTrigger value="data">Data Categories</TabsTrigger>
          <TabsTrigger value="consent">Consent Management</TabsTrigger>
          <TabsTrigger value="tools">Privacy Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Privacy Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Retention */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Data Retention Period (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={privacySettings.dataRetentionDays}
                  onChange={(e) => handleSettingChange('dataRetentionDays', parseInt(e.target.value))}
                  className="w-32 px-3 py-2 border border-primary rounded-lg bg-surface-primary text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-tertiary mt-1">
                  How long to keep user data before automatic deletion
                </p>
              </div>

              {/* Privacy Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-primary">
                        Anonymize Analytics Data
                      </label>
                      <p className="text-xs text-secondary">
                        Remove personally identifiable information from analytics
                      </p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('anonymizeAnalytics', !privacySettings.anonymizeAnalytics)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacySettings.anonymizeAnalytics ? 'bg-success' : 'bg-tertiary'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacySettings.anonymizeAnalytics ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-primary">
                        Redact Sensitive Information
                      </label>
                      <p className="text-xs text-secondary">
                        Automatically detect and redact PII in text analysis
                      </p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('redactSensitiveInfo', !privacySettings.redactSensitiveInfo)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacySettings.redactSensitiveInfo ? 'bg-success' : 'bg-tertiary'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacySettings.redactSensitiveInfo ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-primary">
                        Enable Data Export
                      </label>
                      <p className="text-xs text-secondary">
                        Allow users to export their personal data
                      </p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('enableDataExport', !privacySettings.enableDataExport)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacySettings.enableDataExport ? 'bg-success' : 'bg-tertiary'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacySettings.enableDataExport ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-primary">
                        Allow Data Deletion
                      </label>
                      <p className="text-xs text-secondary">
                        Allow users to request deletion of their data
                      </p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('allowDataDeletion', !privacySettings.allowDataDeletion)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacySettings.allowDataDeletion ? 'bg-success' : 'bg-tertiary'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacySettings.allowDataDeletion ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-primary">
                        Log Data Access
                      </label>
                      <p className="text-xs text-secondary">
                        Keep audit logs of all data access operations
                      </p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('logDataAccess', !privacySettings.logDataAccess)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacySettings.logDataAccess ? 'bg-success' : 'bg-tertiary'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacySettings.logDataAccess ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-primary">
                        Encrypt Stored Data
                      </label>
                      <p className="text-xs text-secondary">
                        Encrypt sensitive data at rest
                      </p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('encryptStoredData', !privacySettings.encryptStoredData)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacySettings.encryptStoredData ? 'bg-success' : 'bg-tertiary'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacySettings.encryptStoredData ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-primary">
                        Require Analytics Consent
                      </label>
                      <p className="text-xs text-secondary">
                        Require explicit consent for analytics tracking
                      </p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('requireConsentForAnalytics', !privacySettings.requireConsentForAnalytics)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacySettings.requireConsentForAnalytics ? 'bg-success' : 'bg-tertiary'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacySettings.requireConsentForAnalytics ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dataCategories.map(category => (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      {category.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {category.isPersonalData && (
                        <Badge variant="warning" className="text-xs">
                          Personal Data
                        </Badge>
                      )}
                      {category.canBeAnonymized && (
                        <Badge variant="default" className="text-xs">
                          Anonymizable
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-secondary mb-4">
                    {category.description}
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-tertiary">Data Types</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {category.dataTypes.map(type => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-tertiary">Retention Period:</span>
                      <span className="text-primary font-medium">
                        {category.retentionPeriod} days
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-tertiary">Can be deleted:</span>
                      {category.canBeDeleted ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="consent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Consent Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {consentRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Info className="w-12 h-12 mx-auto mb-4 text-tertiary" />
                  <p className="text-secondary">No consent records found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {consentRecords.map(record => (
                    <div key={record.id} className="border border-primary rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-primary">{record.category}</span>
                          <Badge variant={record.granted ? 'success' : 'destructive'}>
                            {record.granted ? 'Granted' : 'Denied'}
                          </Badge>
                        </div>
                        <span className="text-xs text-tertiary">
                          v{record.version}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-tertiary">User ID:</span>
                          <span className="text-primary ml-2 font-mono">
                            {record.userId.substring(0, 8)}...
                          </span>
                        </div>

                        <div>
                          <span className="text-tertiary">Timestamp:</span>
                          <span className="text-primary ml-2">
                            {record.timestamp.toLocaleDateString()}
                          </span>
                        </div>

                        {record.ipAddress && (
                          <div className="col-span-2">
                            <span className="text-tertiary">IP Address:</span>
                            <span className="text-primary ml-2 font-mono">
                              {PrivacyProtection.anonymizeIpAddress(record.ipAddress)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Data Export
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary mb-4">
                  Export user data in a portable format for GDPR compliance.
                </p>

                <Button
                  onClick={handleDataExport}
                  disabled={!privacySettings.enableDataExport}
                  className="w-full"
                >
                  <Download className="w-4 h-4" />
                  Export User Data
                </Button>

                {!privacySettings.enableDataExport && (
                  <p className="text-xs text-warning mt-2">
                    Data export is currently disabled in privacy settings
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Data Deletion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Data Deletion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary mb-4">
                  Permanently delete user data that can be safely removed.
                </p>

                <Button
                  variant="destructive"
                  onClick={() => handleDataDeletion(['user-data', 'analysis-data'])}
                  disabled={!privacySettings.allowDataDeletion}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete User Data
                </Button>

                {!privacySettings.allowDataDeletion && (
                  <p className="text-xs text-warning mt-2">
                    Data deletion is currently disabled in privacy settings
                  </p>
                )}
              </CardContent>
            </Card>

            {/* PII Detection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  PII Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary mb-4">
                  Test text for personally identifiable information.
                </p>

                <textarea
                  placeholder="Enter text to check for PII..."
                  className="w-full h-24 px-3 py-2 border border-primary rounded-lg bg-surface-primary text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />

                <Button variant="outline" className="w-full mt-2">
                  <Eye className="w-4 h-4" />
                  Check for PII
                </Button>
              </CardContent>
            </Card>

            {/* Data Anonymization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="w-5 h-5" />
                  Data Anonymization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary mb-4">
                  Anonymize user data for analytics and research purposes.
                </p>

                <Button
                  variant="outline"
                  disabled={!privacySettings.anonymizeAnalytics}
                  className="w-full"
                >
                  <UserX className="w-4 h-4" />
                  Anonymize Analytics Data
                </Button>

                {!privacySettings.anonymizeAnalytics && (
                  <p className="text-xs text-warning mt-2">
                    Data anonymization is currently disabled
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Data Export Modal */}
      <Modal
        isOpen={isDataExportModalOpen}
        onClose={() => { }}
        title="Exporting User Data"
        size="md"
      >
        <div className="text-center py-8">
          <Download className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold text-primary mb-2">
            Preparing Data Export
          </h3>
          <p className="text-secondary mb-6">
            Please wait while we collect and prepare your data for export.
          </p>

          <div className="w-full bg-surface-secondary rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>

          <p className="text-sm text-tertiary">
            {exportProgress}% complete
          </p>
        </div>
      </Modal>

      {/* Data Deletion Modal */}
      <Modal
        isOpen={isDataDeletionModalOpen}
        onClose={() => { }}
        title="Deleting User Data"
        size="md"
      >
        <div className="text-center py-8">
          <Trash2 className="w-12 h-12 mx-auto mb-4 text-error" />
          <h3 className="text-lg font-semibold text-primary mb-2">
            Deleting User Data
          </h3>
          <p className="text-secondary mb-6">
            Please wait while we permanently delete the requested data.
          </p>

          <div className="w-full bg-surface-secondary rounded-full h-2 mb-4">
            <div
              className="bg-error h-2 rounded-full transition-all duration-300"
              style={{ width: `${deletionProgress}%` }}
            />
          </div>

          <p className="text-sm text-tertiary">
            {deletionProgress}% complete
          </p>

          <div className="mt-6 p-4 bg-warning/10 border border-warning rounded-lg">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Warning</span>
            </div>
            <p className="text-xs text-warning mt-1">
              This action cannot be undone. Data will be permanently deleted.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};