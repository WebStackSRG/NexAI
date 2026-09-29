import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionReceiptModal } from '../TransactionReceiptModal';

describe('TransactionReceiptModal Component', () => {
  const mockTx = {
    _id: 'tx_rec_123',
    planId: 'starter_pack',
    amountINR: 49,
    creditsAdded: 500,
    status: 'success',
    orderId: 'order_test_123',
    paymentId: 'pay_test_456',
    createdAt: new Date('2026-03-15T12:00:00Z').toISOString(),
  };

  it('does not render when open is false', () => {
    render(<TransactionReceiptModal open={false} transaction={mockTx} onClose={vi.fn()} />);
    expect(screen.queryByText(/transaction receipt/i)).not.toBeInTheDocument();
  });

  it('renders receipt details accurately when open', () => {
    render(<TransactionReceiptModal open={true} transaction={mockTx} onClose={vi.fn()} />);

    expect(screen.getByText('Transaction Receipt')).toBeInTheDocument();
    expect(screen.getByText('Starter Top-Up (500 Credits)')).toBeInTheDocument();
    expect(screen.getByText('49')).toBeInTheDocument();
    expect(screen.getByText(/\+500 credits added/i)).toBeInTheDocument();
    expect(screen.getByText('tx_rec_123')).toBeInTheDocument();
    expect(screen.getByText('pay_test_456')).toBeInTheDocument();
    expect(screen.getByText('Razorpay Test Mode')).toBeInTheDocument();
  });

  it('calls onClose when Done button is clicked', () => {
    const handleClose = vi.fn();
    render(<TransactionReceiptModal open={true} transaction={mockTx} onClose={handleClose} />);

    const doneBtn = screen.getByRole('button', { name: /done/i });
    fireEvent.click(doneBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
