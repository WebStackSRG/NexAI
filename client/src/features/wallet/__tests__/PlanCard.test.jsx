import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlanCard } from '../PlanCard';

describe('PlanCard Component', () => {
  const mockPlan = {
    id: 'starter_pack',
    name: 'Starter Top-Up',
    description: 'Perfect for quick tests and assignments',
    amountINR: 49,
    credits: 500,
    tier: 'free',
    badge: null,
    popular: false,
    features: ['500 AI credits', 'Gemini 3.8 Flash access'],
  };

  it('renders plan details, price and features accurately', () => {
    render(<PlanCard plan={mockPlan} />);

    expect(screen.getByText('Starter Top-Up')).toBeInTheDocument();
    expect(screen.getByText('₹49')).toBeInTheDocument();
    expect(screen.getByText(/\/ 500 credits/i)).toBeInTheDocument();
    expect(screen.getByText('500 AI credits')).toBeInTheDocument();
    expect(screen.getByText('Gemini 3.8 Flash access')).toBeInTheDocument();
  });

  it('triggers checkout and simulation callbacks when clicked', () => {
    const handleCheckout = vi.fn();
    const handleSimulate = vi.fn();

    render(
      <PlanCard
        plan={mockPlan}
        onCheckout={handleCheckout}
        onSimulate={handleSimulate}
      />,
    );

    const rechargeBtn = screen.getByRole('button', { name: /recharge ₹49/i });
    fireEvent.click(rechargeBtn);
    expect(handleCheckout).toHaveBeenCalledWith(mockPlan);

    const testBtn = screen.getByRole('button', { name: /instant test mode recharge/i });
    fireEvent.click(testBtn);
    expect(handleSimulate).toHaveBeenCalledWith(mockPlan);
  });
});
