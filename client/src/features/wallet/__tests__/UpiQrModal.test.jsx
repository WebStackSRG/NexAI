import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UpiQrModal } from '../UpiQrModal';

describe('UpiQrModal Component', () => {
  const mockPlan = {
    id: 'starter_pack',
    name: 'Starter Top-Up',
    amountINR: 49,
    credits: 500,
  };

  it('does not render when open is false', () => {
    render(
      <UpiQrModal
        open={false}
        plan={mockPlan}
        onClose={vi.fn()}
        onConfirmPayment={vi.fn()}
      />,
    );
    expect(screen.queryByText(/direct razorpay upi & qr payment/i)).not.toBeInTheDocument();
  });

  it('renders plan summary, QR details, and UPI apps when open', () => {
    render(
      <UpiQrModal
        open={true}
        plan={mockPlan}
        onClose={vi.fn()}
        onConfirmPayment={vi.fn()}
      />,
    );

    expect(screen.getByText(/direct razorpay upi & qr payment/i)).toBeInTheDocument();
    expect(screen.getByText('Starter Top-Up')).toBeInTheDocument();
    expect(screen.getByText('₹49')).toBeInTheDocument();
    expect(screen.getByText(/\+500 ai credits/i)).toBeInTheDocument();
    expect(screen.getByText('Razorpay Dynamic UPI QR')).toBeInTheDocument();
    expect(screen.getByText('GPay')).toBeInTheDocument();
    expect(screen.getByText('PhonePe')).toBeInTheDocument();
    expect(screen.getByText('Paytm')).toBeInTheDocument();
    expect(screen.getByText(/zero card details stored/i)).toBeInTheDocument();
  });

  it('triggers onConfirmPayment when Simulate Scan & Approve is clicked', () => {
    const handleConfirm = vi.fn();
    render(
      <UpiQrModal
        open={true}
        plan={mockPlan}
        onClose={vi.fn()}
        onConfirmPayment={handleConfirm}
      />,
    );

    const approveBtn = screen.getByRole('button', { name: /simulate scan & approve/i });
    fireEvent.click(approveBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
