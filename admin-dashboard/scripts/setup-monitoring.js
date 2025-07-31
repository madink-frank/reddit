#!/usr/bin/env node

/**
 * Production Monitoring and Alerting Setup
 * 
 * Sets up comprehensive monitoring, alerting, and health checks for the production environment
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MONITORING_CONFIG = {
  // Health check endpoints
  healthChecks: [
    {
      name: 'Dashboard Health',
      url: '/health',
      method: 'GET',
      expectedStatus: 200,
      timeout: 5000,
      interval: 30000, // 30 seconds
      retries: 3
    },
    {
      name: 'API Health',
      url: '/api/health',
      method: 'GET',
      expectedStatus: 200,
      timeout: 10000,
      interval: 60000, // 1 minute
      retries: 3
    },
    {
      name: 'Database Connectivity',
      url: '/api/health/database',
      method: 'GET',
      expectedStatus: 200,
      timeout: 15000,
      interval: 120000, // 2 minutes
      retries: 2
    },
    {
      name: 'Redis Connectivity',
      url: '/api/health/redis',
      method: 'GET',
      expectedStatus: 200,
      timeout: 10000,
      interval: 120000, // 2 minutes
      retries: 2
    }
  ],

  // Performance metrics to track
  metrics: [
    {
      name: 'response_time',
      description: 'Average response time',
      unit: 'ms',
      threshold: {
        warning: 1000,
        critical: 3000
      }
    },
    {
      name: 'error_rate',
      description: 'Error rate percentage',
      unit: '%',
      threshold: {
        warning: 5,
        critical: 10
      }
    },
    {
      name: 'cpu_usage',
      description: 'CPU usage percentage',
      unit: '%',
      threshold: {
        warning: 70,
        critical: 90
      }
    },
    {
      name: 'memory_usage',
      description: 'Memory usage percentage',
      unit: '%',
      threshold: {
        warning: 80,
        critical: 95
      }
    },
    {
      name: 'disk_usage',
      description: 'Disk usage percentage',
      unit: '%',
      threshold: {
        warning: 80,
        critical: 90
      }
    }
  ],

  // Alert channels
  alerting: {
    email: {
      enabled: true,
      recipients: [
        'admin@example.com',
        'devops@example.com'
      ],
      smtp: {
        host: process.env.SMTP_HOST || 'localhost',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      }
    },
    slack: {
      enabled: true,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: '#alerts',
      username: 'MonitoringBot'
    },
    webhook: {
      enabled: true,
      url: process.env.WEBHOOK_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WEBHOOK_TOKEN}`
      }
    }
  },

  // Log aggregation
  logging: {
    level: 'info',
    format: 'json',
    outputs: [
      {
        type: 'file',
        filename: 'logs/application.log',
        maxSize: '100MB',
        maxFiles: 10
      },
      {
        type: 'console',
        colorize: true
      }
    ],
    // External log services
    external: {
      datadog: {
        enabled: !!process.env.DATADOG_API_KEY,
        apiKey: process.env.DATADOG_API_KEY,
        service: 'reddit-content-platform-dashboard',
        env: process.env.NODE_ENV || 'production'
      },
      logflare: {
        enabled: !!process.env.LOGFLARE_API_KEY,
        apiKey: process.env.LOGFLARE_API_KEY,
        sourceToken: process.env.LOGFLARE_SOURCE_TOKEN
      }
    }
  }
};

// Utility functions
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
};

const error = (message) => {
  log(message, 'error');
  process.exit(1);
};

const success = (message) => {
  log(message, 'success');
};

// Create monitoring configuration files
const createMonitoringFiles = () => {
  log('Creating monitoring configuration files...');

  // Create logs directory
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Create monitoring config file
  const monitoringConfigPath = path.join(process.cwd(), 'monitoring.config.json');
  fs.writeFileSync(monitoringConfigPath, JSON.stringify(MONITORING_CONFIG, null, 2));
  success(`Monitoring configuration created: ${monitoringConfigPath}`);

  // Create health check script
  const healthCheckScript = `#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('monitoring.config.json', 'utf8'));

class HealthChecker {
  constructor() {
    this.results = new Map();
    this.alertsSent = new Set();
  }

  async checkEndpoint(check) {
    const startTime = Date.now();
    const module = check.url.startsWith('https:') ? https : http;
    
    return new Promise((resolve) => {
      const req = module.request(check.url, {
        method: check.method,
        timeout: check.timeout
      }, (res) => {
        const responseTime = Date.now() - startTime;
        const success = res.statusCode === check.expectedStatus;
        
        resolve({
          name: check.name,
          success,
          responseTime,
          statusCode: res.statusCode,
          timestamp: new Date().toISOString()
        });
      });

      req.on('error', (err) => {
        resolve({
          name: check.name,
          success: false,
          error: err.message,
          timestamp: new Date().toISOString()
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          name: check.name,
          success: false,
          error: 'Timeout',
          timestamp: new Date().toISOString()
        });
      });

      req.end();
    });
  }

  async runHealthChecks() {
    console.log('Running health checks...');
    
    for (const check of config.healthChecks) {
      const result = await this.checkEndpoint(check);
      this.results.set(check.name, result);
      
      if (result.success) {
        console.log(\`✅ \${check.name}: OK (\${result.responseTime}ms)\`);
      } else {
        console.log(\`❌ \${check.name}: FAILED - \${result.error || 'Status ' + result.statusCode}\`);
        await this.sendAlert(check, result);
      }
    }
  }

  async sendAlert(check, result) {
    const alertKey = \`\${check.name}-\${Date.now()}\`;
    
    if (this.alertsSent.has(alertKey)) {
      return; // Prevent duplicate alerts
    }

    this.alertsSent.add(alertKey);
    
    const alertData = {
      service: check.name,
      status: 'critical',
      message: \`Health check failed: \${result.error || 'Unexpected status code'}\`,
      timestamp: result.timestamp,
      details: result
    };

    // Send to configured alert channels
    if (config.alerting.webhook.enabled) {
      try {
        const response = await fetch(config.alerting.webhook.url, {
          method: 'POST',
          headers: config.alerting.webhook.headers,
          body: JSON.stringify(alertData)
        });
        
        if (response.ok) {
          console.log('Alert sent via webhook');
        }
      } catch (err) {
        console.error('Failed to send webhook alert:', err.message);
      }
    }
  }

  startMonitoring() {
    console.log('Starting continuous health monitoring...');
    
    // Run initial check
    this.runHealthChecks();
    
    // Schedule recurring checks
    config.healthChecks.forEach(check => {
      setInterval(() => {
        this.checkEndpoint(check).then(result => {
          this.results.set(check.name, result);
          
          if (!result.success) {
            this.sendAlert(check, result);
          }
        });
      }, check.interval);
    });
  }
}

// Start monitoring if run directly
if (require.main === module) {
  const checker = new HealthChecker();
  checker.startMonitoring();
}

module.exports = HealthChecker;
`;

  const healthCheckPath = path.join(process.cwd(), 'scripts', 'health-check.js');
  fs.writeFileSync(healthCheckPath, healthCheckScript);
  fs.chmodSync(healthCheckPath, '755');
  success(`Health check script created: ${healthCheckPath}`);

  // Create performance monitoring script
  const performanceScript = `#!/usr/bin/env node

const os = require('os');
const fs = require('fs');

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.config = JSON.parse(fs.readFileSync('monitoring.config.json', 'utf8'));
  }

  collectSystemMetrics() {
    const cpuUsage = this.getCPUUsage();
    const memoryUsage = this.getMemoryUsage();
    const diskUsage = this.getDiskUsage();

    return {
      timestamp: new Date().toISOString(),
      cpu: cpuUsage,
      memory: memoryUsage,
      disk: diskUsage,
      uptime: os.uptime(),
      loadAverage: os.loadavg()
    };
  }

  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return {
      usage: usage,
      cores: cpus.length,
      model: cpus[0].model
    };
  }

  getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usage = (used / total) * 100;

    return {
      total: Math.round(total / 1024 / 1024), // MB
      used: Math.round(used / 1024 / 1024), // MB
      free: Math.round(free / 1024 / 1024), // MB
      usage: Math.round(usage)
    };
  }

  getDiskUsage() {
    try {
      const stats = fs.statSync('.');
      // This is a simplified disk usage check
      // In production, you'd want to use a proper disk usage library
      return {
        usage: 0, // Placeholder
        available: 'unknown'
      };
    } catch (err) {
      return {
        usage: 0,
        available: 'unknown',
        error: err.message
      };
    }
  }

  checkThresholds(metrics) {
    const alerts = [];

    this.config.metrics.forEach(metricConfig => {
      const value = this.getMetricValue(metrics, metricConfig.name);
      
      if (value >= metricConfig.threshold.critical) {
        alerts.push({
          metric: metricConfig.name,
          level: 'critical',
          value: value,
          threshold: metricConfig.threshold.critical,
          message: \`\${metricConfig.description} is critically high: \${value}\${metricConfig.unit}\`
        });
      } else if (value >= metricConfig.threshold.warning) {
        alerts.push({
          metric: metricConfig.name,
          level: 'warning',
          value: value,
          threshold: metricConfig.threshold.warning,
          message: \`\${metricConfig.description} is high: \${value}\${metricConfig.unit}\`
        });
      }
    });

    return alerts;
  }

  getMetricValue(metrics, metricName) {
    switch (metricName) {
      case 'cpu_usage':
        return metrics.cpu.usage;
      case 'memory_usage':
        return metrics.memory.usage;
      case 'disk_usage':
        return metrics.disk.usage;
      default:
        return 0;
    }
  }

  startMonitoring() {
    console.log('Starting performance monitoring...');
    
    setInterval(() => {
      const metrics = this.collectSystemMetrics();
      const alerts = this.checkThresholds(metrics);
      
      // Log metrics
      console.log(\`CPU: \${metrics.cpu.usage}%, Memory: \${metrics.memory.usage}%, Disk: \${metrics.disk.usage}%\`);
      
      // Handle alerts
      alerts.forEach(alert => {
        console.log(\`⚠️  \${alert.level.toUpperCase()}: \${alert.message}\`);
        // Here you would send alerts to configured channels
      });
      
      // Store metrics for historical analysis
      this.metrics.set(Date.now(), metrics);
      
      // Keep only last 1000 entries
      if (this.metrics.size > 1000) {
        const oldestKey = this.metrics.keys().next().value;
        this.metrics.delete(oldestKey);
      }
      
    }, 60000); // Check every minute
  }
}

// Start monitoring if run directly
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  monitor.startMonitoring();
}

module.exports = PerformanceMonitor;
`;

  const performancePath = path.join(process.cwd(), 'scripts', 'performance-monitor.js');
  fs.writeFileSync(performancePath, performanceScript);
  fs.chmodSync(performancePath, '755');
  success(`Performance monitoring script created: ${performancePath}`);
};

// Create backup and disaster recovery scripts
const createBackupScripts = () => {
  log('Creating backup and disaster recovery scripts...');

  const backupScript = `#!/bin/bash

# Backup and Disaster Recovery Script
# Creates backups of application data and configurations

set -e

BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup_\${TIMESTAMP}"

# Colors
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
RED='\\033[0;31m'
NC='\\033[0m'

log() {
    echo -e "\${GREEN}[BACKUP]\${NC} \$1"
}

warning() {
    echo -e "\${YELLOW}[WARNING]\${NC} \$1"
}

error() {
    echo -e "\${RED}[ERROR]\${NC} \$1"
    exit 1
}

# Create backup directory
mkdir -p "\$BACKUP_DIR"

# Backup application files
log "Creating application backup..."
tar -czf "\$BACKUP_DIR/\${BACKUP_NAME}_app.tar.gz" \\
    --exclude=node_modules \\
    --exclude=dist \\
    --exclude=.git \\
    --exclude=logs \\
    --exclude=backups \\
    .

# Backup configuration files
log "Backing up configuration files..."
mkdir -p "\$BACKUP_DIR/\${BACKUP_NAME}_config"
cp -r .env* "\$BACKUP_DIR/\${BACKUP_NAME}_config/" 2>/dev/null || true
cp monitoring.config.json "\$BACKUP_DIR/\${BACKUP_NAME}_config/" 2>/dev/null || true
cp package.json "\$BACKUP_DIR/\${BACKUP_NAME}_config/"
cp package-lock.json "\$BACKUP_DIR/\${BACKUP_NAME}_config/" 2>/dev/null || true

# Backup logs
if [ -d "logs" ]; then
    log "Backing up logs..."
    tar -czf "\$BACKUP_DIR/\${BACKUP_NAME}_logs.tar.gz" logs/
fi

# Create backup manifest
cat > "\$BACKUP_DIR/\${BACKUP_NAME}_manifest.json" << EOF
{
  "backupId": "\$BACKUP_NAME",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "files": {
    "application": "\${BACKUP_NAME}_app.tar.gz",
    "configuration": "\${BACKUP_NAME}_config/",
    "logs": "\${BACKUP_NAME}_logs.tar.gz"
  },
  "size": "$(du -sh \$BACKUP_DIR/\${BACKUP_NAME}* | awk '{sum += \$1} END {print sum}')"
}
EOF

# Cleanup old backups (keep last 10)
log "Cleaning up old backups..."
ls -t "\$BACKUP_DIR"/backup_*_manifest.json 2>/dev/null | tail -n +11 | while read manifest; do
    backup_id=\$(basename "\$manifest" _manifest.json)
    rm -f "\$BACKUP_DIR/\${backup_id}"*
    log "Removed old backup: \$backup_id"
done

log "Backup completed successfully: \$BACKUP_NAME"
log "Backup location: \$BACKUP_DIR"
log "Backup size: \$(du -sh \$BACKUP_DIR/\${BACKUP_NAME}* | awk '{sum += \$1} END {print sum}')"

# Upload to cloud storage if configured
if [ -n "\$BACKUP_S3_BUCKET" ]; then
    log "Uploading backup to S3..."
    aws s3 sync "\$BACKUP_DIR" "s3://\$BACKUP_S3_BUCKET/backups/" --exclude "*" --include "\${BACKUP_NAME}*"
    log "Backup uploaded to S3: s3://\$BACKUP_S3_BUCKET/backups/"
fi
`;

  const backupPath = path.join(process.cwd(), 'scripts', 'backup.sh');
  fs.writeFileSync(backupPath, backupScript);
  fs.chmodSync(backupPath, '755');
  success(`Backup script created: ${backupPath}`);

  // Create restore script
  const restoreScript = `#!/bin/bash

# Disaster Recovery Restore Script
# Restores application from backup

set -e

BACKUP_DIR="backups"

# Colors
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
RED='\\033[0;31m'
NC='\\033[0m'

log() {
    echo -e "\${GREEN}[RESTORE]\${NC} \$1"
}

warning() {
    echo -e "\${YELLOW}[WARNING]\${NC} \$1"
}

error() {
    echo -e "\${RED}[ERROR]\${NC} \$1"
    exit 1
}

# Check if backup ID is provided
if [ -z "\$1" ]; then
    echo "Usage: \$0 <backup_id>"
    echo "Available backups:"
    ls -1 "\$BACKUP_DIR"/backup_*_manifest.json 2>/dev/null | sed 's/_manifest.json//' | sed 's/.*\\///' || echo "No backups found"
    exit 1
fi

BACKUP_ID="\$1"
MANIFEST_FILE="\$BACKUP_DIR/\${BACKUP_ID}_manifest.json"

# Check if backup exists
if [ ! -f "\$MANIFEST_FILE" ]; then
    error "Backup not found: \$BACKUP_ID"
fi

# Read backup manifest
log "Reading backup manifest..."
BACKUP_INFO=\$(cat "\$MANIFEST_FILE")
echo "\$BACKUP_INFO" | jq .

# Confirm restore
warning "This will restore the application to backup: \$BACKUP_ID"
warning "Current application state will be backed up first"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! \$REPLY =~ ^[Yy]\$ ]]; then
    error "Restore cancelled by user"
fi

# Create backup of current state
log "Creating backup of current state..."
CURRENT_BACKUP="current_\$(date +"%Y%m%d_%H%M%S")"
tar -czf "\$BACKUP_DIR/\${CURRENT_BACKUP}_app.tar.gz" \\
    --exclude=node_modules \\
    --exclude=dist \\
    --exclude=.git \\
    --exclude=logs \\
    --exclude=backups \\
    .

# Restore application files
log "Restoring application files..."
if [ -f "\$BACKUP_DIR/\${BACKUP_ID}_app.tar.gz" ]; then
    tar -xzf "\$BACKUP_DIR/\${BACKUP_ID}_app.tar.gz"
    log "Application files restored"
else
    error "Application backup file not found"
fi

# Restore configuration files
log "Restoring configuration files..."
if [ -d "\$BACKUP_DIR/\${BACKUP_ID}_config" ]; then
    cp -r "\$BACKUP_DIR/\${BACKUP_ID}_config"/* .
    log "Configuration files restored"
fi

# Restore logs if requested
read -p "Restore logs? (y/N): " -n 1 -r
echo
if [[ \$REPLY =~ ^[Yy]\$ ]]; then
    if [ -f "\$BACKUP_DIR/\${BACKUP_ID}_logs.tar.gz" ]; then
        tar -xzf "\$BACKUP_DIR/\${BACKUP_ID}_logs.tar.gz"
        log "Logs restored"
    fi
fi

# Reinstall dependencies
log "Reinstalling dependencies..."
npm ci

# Rebuild application
log "Rebuilding application..."
npm run build

log "Restore completed successfully!"
log "Current state backup saved as: \$CURRENT_BACKUP"
warning "Please verify the application is working correctly"
warning "You may need to restart services and update environment variables"
`;

  const restorePath = path.join(process.cwd(), 'scripts', 'restore.sh');
  fs.writeFileSync(restorePath, restoreScript);
  fs.chmodSync(restorePath, '755');
  success(`Restore script created: ${restorePath}`);
};

// Create systemd service files for Linux deployment
const createSystemdServices = () => {
  log('Creating systemd service files...');

  const healthCheckService = `[Unit]
Description=Dashboard Health Check Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/dashboard
ExecStart=/usr/bin/node scripts/health-check.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
`;

  const performanceService = `[Unit]
Description=Dashboard Performance Monitor
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/dashboard
ExecStart=/usr/bin/node scripts/performance-monitor.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
`;

  // Create systemd directory
  const systemdDir = path.join(process.cwd(), 'systemd');
  if (!fs.existsSync(systemdDir)) {
    fs.mkdirSync(systemdDir, { recursive: true });
  }

  fs.writeFileSync(path.join(systemdDir, 'dashboard-health-check.service'), healthCheckService);
  fs.writeFileSync(path.join(systemdDir, 'dashboard-performance-monitor.service'), performanceService);

  success('Systemd service files created in ./systemd/');
};

// Create Docker health check
const createDockerHealthCheck = () => {
  log('Creating Docker health check...');

  const dockerHealthCheck = `#!/bin/bash
# Docker health check script

# Check if the application is responding
curl -f http://localhost:3000/health || exit 1

# Check if critical services are running
if ! pgrep -f "node.*health-check" > /dev/null; then
    echo "Health check service not running"
    exit 1
fi

echo "Health check passed"
exit 0
`;

  const dockerHealthPath = path.join(process.cwd(), 'scripts', 'docker-health-check.sh');
  fs.writeFileSync(dockerHealthPath, dockerHealthCheck);
  fs.chmodSync(dockerHealthPath, '755');
  success(`Docker health check created: ${dockerHealthPath}`);
};

// Main setup function
const main = () => {
  log('Setting up production monitoring and alerting...');

  try {
    createMonitoringFiles();
    createBackupScripts();
    createSystemdServices();
    createDockerHealthCheck();

    success('Monitoring setup completed successfully!');
    
    log('Next steps:');
    log('1. Configure environment variables for alerting (SMTP, Slack, etc.)');
    log('2. Set up log rotation for application logs');
    log('3. Configure external monitoring services (Datadog, New Relic, etc.)');
    log('4. Test health checks and alerting');
    log('5. Schedule regular backups');
    
    log('To start monitoring:');
    log('  node scripts/health-check.js');
    log('  node scripts/performance-monitor.js');
    
    log('To create a backup:');
    log('  ./scripts/backup.sh');
    
    log('To restore from backup:');
    log('  ./scripts/restore.sh <backup_id>');

  } catch (err) {
    error(`Setup failed: ${err.message}`);
  }
};

// Run setup if called directly
if (require.main === module) {
  main();
}

module.exports = {
  MONITORING_CONFIG,
  createMonitoringFiles,
  createBackupScripts,
  createSystemdServices,
  createDockerHealthCheck
};