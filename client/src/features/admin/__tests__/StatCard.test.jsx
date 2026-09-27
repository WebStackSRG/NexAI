import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Zap } from 'lucide-react';
import { StatCard } from '../StatCard';

describe('StatCard Component', () => {
  it('renders title, value, subtitle, and icon', () => {
    render(
      <StatCard
        title="Total Tokens"
        value="125,000"
        subtitle="Across all sessions"
        icon={<Zap data-testid="zap-icon" />}
        tone="accent"
      />,
    );

    expect(screen.getByText('Total Tokens')).toBeInTheDocument();
    expect(screen.getByText('125,000')).toBeInTheDocument();
    expect(screen.getByText('Across all sessions')).toBeInTheDocument();
    expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
  });
});
