import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuotaTelemetryCard } from '../QuotaTelemetryCard';

describe('QuotaTelemetryCard Component', () => {
  const mockTelemetry = {
    dailyLimit: 1500,
    requestsToday: 42,
    requestsRemaining: 1458,
    quotaUsedPercentage: 2.8,
    rpm: 3,
    rpmLimit: 15,
    tpm: 4500,
    tpmLimit: 1000000,
    tokensToday: {
      total: 12500,
      inputTokens: 5000,
      outputTokens: 7500,
      flashTokens: 10000,
      proTokens: 2500,
    },
    resetTimeUTC: '00:00 UTC',
  };

  const mockConfigQuotaFree = {
    billingEnforcementMode: 'quota_free',
    dailyGeminiQuotaLimit: 1500,
  };

  const mockConfigCreditStrict = {
    billingEnforcementMode: 'credit_strict',
    dailyGeminiQuotaLimit: 1500,
  };

  it('renders 1,500 RPD daily quota gauge and percentage', () => {
    render(
      <QuotaTelemetryCard
        telemetry={mockTelemetry}
        config={mockConfigQuotaFree}
      />,
    );

    expect(screen.getByText(/Daily Quota Progress/i)).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('/ 1,500 requests')).toBeInTheDocument();
    expect(screen.getByText(/1,458/)).toBeInTheDocument();
    expect(screen.getByText(/2.8% consumed/i)).toBeInTheDocument();
  });

  it('renders 15 RPM and TPM rate limit safety indicators', () => {
    render(
      <QuotaTelemetryCard
        telemetry={mockTelemetry}
        config={mockConfigQuotaFree}
      />,
    );

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('/ 15 RPM')).toBeInTheDocument();
    expect(screen.getByText('4,500')).toBeInTheDocument();
    expect(screen.getByText('/ 1M TPM')).toBeInTheDocument();
  });

  it('renders daily token breakdown (total, input, output, flash/pro split)', () => {
    render(
      <QuotaTelemetryCard
        telemetry={mockTelemetry}
        config={mockConfigQuotaFree}
      />,
    );

    expect(screen.getByText('12,500')).toBeInTheDocument();
    expect(screen.getByText('5,000')).toBeInTheDocument();
    expect(screen.getByText('7,500')).toBeInTheDocument();
    expect(screen.getByText('Flash: 10,000')).toBeInTheDocument();
    expect(screen.getByText('Pro: 2,500')).toBeInTheDocument();
  });

  it('renders Quota-Free Active badge and triggers 1-click toggle to credit_strict', async () => {
    const handleToggle = vi.fn().mockResolvedValue({});

    render(
      <QuotaTelemetryCard
        telemetry={mockTelemetry}
        config={mockConfigQuotaFree}
        onModeToggle={handleToggle}
      />,
    );

    expect(screen.getByText(/Quota-Free Active/i)).toBeInTheDocument();

    const toggleBtn = screen.getByRole('button', { name: /Switch to Credit-Strict SaaS/i });
    expect(toggleBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(toggleBtn);
    });
    expect(handleToggle).toHaveBeenCalledWith('credit_strict');
  });

  it('renders Credit-Strict Active badge and triggers 1-click toggle to quota_free', async () => {
    const handleToggle = vi.fn().mockResolvedValue({});

    render(
      <QuotaTelemetryCard
        telemetry={mockTelemetry}
        config={mockConfigCreditStrict}
        onModeToggle={handleToggle}
      />,
    );

    expect(screen.getByText(/Credit-Strict Active/i)).toBeInTheDocument();

    const toggleBtn = screen.getByRole('button', { name: /Switch to Quota-Free Demo/i });
    expect(toggleBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(toggleBtn);
    });
    expect(handleToggle).toHaveBeenCalledWith('quota_free');
  });
});
