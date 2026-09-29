import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RazorpayPaymentModal } from '../RazorpayPaymentModal';

describe('RazorpayPaymentModal Component', () => {
  const mockPlan = {
    id: 'starter_pack',
    name: 'Starter Top-Up',
    amountINR: 49,
    credits: 500,
    tier: 'free',
  };

  it('does not render when open is false', () => {
    render(
      <RazorpayPaymentModal
        open={false}
        plan={mockPlan}
        onClose={vi.fn()}
        onPaymentSuccess={vi.fn()}
      />,
    );
    expect(screen.queryByText(/TEST MODE/i)).not.toBeInTheDocument();
  });

  it('renders Razorpay test mode branding, QR section, and amount when open', () => {
    render(
      <RazorpayPaymentModal
        open={true}
        plan={mockPlan}
        onClose={vi.fn()}
        onPaymentSuccess={vi.fn()}
      />,
    );

    expect(screen.getByText('Razorpay Payment')).toBeInTheDocument();
    expect(screen.getByText('Test Mode')).toBeInTheDocument();
    expect(screen.getByText('Starter Top-Up')).toBeInTheDocument();
    expect(screen.getByText('₹49.00')).toBeInTheDocument();
    expect(screen.getByText('+500 AI Credits')).toBeInTheDocument();
    expect(screen.getByText(/scan with any upi app/i)).toBeInTheDocument();
    expect(screen.getByText('Google Pay')).toBeInTheDocument();
    expect(screen.getByText('PhonePe')).toBeInTheDocument();
  });

  it('triggers payment flow and shows processing state when pay button is clicked', async () => {
    const handleSuccess = vi.fn().mockImplementation(() => new Promise((resolve) => {
      setTimeout(() => resolve({ transaction: { paymentId: 'pay_test_999' } }), 100);
    }));

    render(
      <RazorpayPaymentModal
        open={true}
        plan={mockPlan}
        onClose={vi.fn()}
        onPaymentSuccess={handleSuccess}
      />,
    );

    const payBtn = screen.getByRole('button', { name: /authorize test payment/i });
    fireEvent.click(payBtn);

    expect(screen.getByText(/authorizing payment/i)).toBeInTheDocument();
  });
});
