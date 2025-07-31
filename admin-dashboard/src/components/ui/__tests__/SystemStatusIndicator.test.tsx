/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react';
import { SystemStatusIndicator, getSystemStatus, SystemStatusBadge } from '../SystemStatusIndicator';

describe('SystemStatusIndicator', () => {
  it('renders healthy status correctly', () => {
    render(
      <SystemStatusIndicator
        status="healthy"
        name="Test Service"
        details="All systems operational"
      />
    );

    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('renders warning status correctly', () => {
    render(
      <SystemStatusIndicator
        status="warning"
        name="Test Service"
        details="Minor issues detected"
      />
    );

    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('renders critical status correctly', () => {
    render(
      <SystemStatusIndicator
        status="critical"
        name="Test Service"
        details="Service is down"
      />
    );

    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('renders without label when showLabel is false', () => {
    render(
      <SystemStatusIndicator
        status="healthy"
        name="Test Service"
        showLabel={false}
      />
    );

    expect(screen.queryByText('Healthy')).not.toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(
      <SystemStatusIndicator
        status="healthy"
        name="Test Service"
        size="sm"
      />
    );

    // Test small size
    expect(screen.getByText('Healthy')).toHaveClass('text-xs');

    // Test large size
    rerender(
      <SystemStatusIndicator
        status="healthy"
        name="Test Service"
        size="lg"
      />
    );

    expect(screen.getByText('Healthy')).toHaveClass('text-base');
  });
});

describe('getSystemStatus', () => {
  it('correctly maps status strings to SystemStatusType', () => {
    expect(getSystemStatus('healthy')).toBe('healthy');
    expect(getSystemStatus('ok')).toBe('healthy');
    expect(getSystemStatus('online')).toBe('healthy');
    expect(getSystemStatus('active')).toBe('healthy');
    expect(getSystemStatus('running')).toBe('healthy');

    expect(getSystemStatus('warning')).toBe('warning');
    expect(getSystemStatus('degraded')).toBe('warning');
    expect(getSystemStatus('slow')).toBe('warning');

    expect(getSystemStatus('critical')).toBe('critical');
    expect(getSystemStatus('error')).toBe('critical');
    expect(getSystemStatus('failed')).toBe('critical');
    expect(getSystemStatus('offline')).toBe('critical');
    expect(getSystemStatus('down')).toBe('critical');

    expect(getSystemStatus('loading')).toBe('loading');
    expect(getSystemStatus('checking')).toBe('loading');
    expect(getSystemStatus('pending')).toBe('loading');

    expect(getSystemStatus('unknown')).toBe('unknown');
    expect(getSystemStatus('')).toBe('unknown');
    expect(getSystemStatus(undefined)).toBe('unknown');
  });
});

describe('SystemStatusBadge', () => {
  it('renders badge with correct status', () => {
    render(<SystemStatusBadge status="healthy" />);
    
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('Healthy').closest('span')).toHaveClass('bg-green-50', 'text-green-700');
  });

  it('renders warning badge correctly', () => {
    render(<SystemStatusBadge status="warning" />);
    
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Warning').closest('span')).toHaveClass('bg-yellow-50', 'text-yellow-700');
  });

  it('renders critical badge correctly', () => {
    render(<SystemStatusBadge status="critical" />);
    
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Critical').closest('span')).toHaveClass('bg-red-50', 'text-red-700');
  });
});