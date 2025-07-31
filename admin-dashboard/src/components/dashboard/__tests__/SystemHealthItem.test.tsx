import { render, screen } from '@testing-library/react';
import { SystemHealthItem, SystemHealthItemCompact } from '../SystemHealthItem';

describe('SystemHealthItem', () => {
  it('renders system health item with basic props', () => {
    render(
      <SystemHealthItem
        name="Database"
        status="healthy"
        details="Connection stable"
      />
    );

    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Connection stable')).toBeInTheDocument();
  });

  it('renders with metrics', () => {
    render(
      <SystemHealthItem
        name="Redis Cache"
        status="healthy"
        metrics={{
          latency: 15,
          uptime: 99.9,
          usage: 45
        }}
      />
    );

    expect(screen.getByText('Redis Cache')).toBeInTheDocument();
    expect(screen.getByText(/15ms latency/)).toBeInTheDocument();
    expect(screen.getByText(/99.9% uptime/)).toBeInTheDocument();
    expect(screen.getByText(/45% usage/)).toBeInTheDocument();
  });

  it('handles warning status correctly', () => {
    render(
      <SystemHealthItem
        name="API Service"
        status="warning"
        details="High response time"
      />
    );

    expect(screen.getByText('API Service')).toBeInTheDocument();
    expect(screen.getByText('High response time')).toBeInTheDocument();
  });

  it('handles critical status correctly', () => {
    render(
      <SystemHealthItem
        name="Worker Service"
        status="critical"
        details="Service unavailable"
      />
    );

    expect(screen.getByText('Worker Service')).toBeInTheDocument();
    expect(screen.getByText('Service unavailable')).toBeInTheDocument();
  });

  it('formats custom metrics correctly', () => {
    render(
      <SystemHealthItem
        name="Custom Service"
        status="healthy"
        metrics={{
          custom_metric: 'test_value',
          another_metric: 42
        }}
      />
    );

    expect(screen.getByText('Custom Service')).toBeInTheDocument();
    expect(screen.getByText(/custom_metric: test_value/)).toBeInTheDocument();
    expect(screen.getByText(/another_metric: 42/)).toBeInTheDocument();
  });

  it('shows last checked time when provided', () => {
    const lastChecked = new Date().toISOString();
    render(
      <SystemHealthItem
        name="Test Service"
        status="healthy"
        lastChecked={lastChecked}
      />
    );

    expect(screen.getByText('Test Service')).toBeInTheDocument();
    // The tooltip content with last checked time should be accessible via aria attributes
  });
});

describe('SystemHealthItemCompact', () => {
  it('renders compact version correctly', () => {
    render(
      <SystemHealthItemCompact
        name="Compact Service"
        status="healthy"
        details="All good"
      />
    );

    expect(screen.getByText('Compact Service')).toBeInTheDocument();
  });

  it('handles metrics in compact mode', () => {
    render(
      <SystemHealthItemCompact
        name="Compact Service"
        status="warning"
        metrics={{
          latency: 100,
          errors: 5
        }}
      />
    );

    expect(screen.getByText('Compact Service')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    // In compact mode, metrics are passed to the tooltip, not displayed directly
  });
});