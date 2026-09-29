import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TransactionTable } from '../TransactionTable';

describe('TransactionTable Component', () => {
  it('renders empty state when there are no transactions', () => {
    render(<TransactionTable transactions={[]} />);
    expect(screen.getByText(/no billing transactions yet/i)).toBeInTheDocument();
  });

  it('renders transactions ledger accurately with status badges', () => {
    const mockTxs = [
      {
        _id: 'tx_1',
        planId: 'starter_pack',
        amountINR: 49,
        creditsAdded: 500,
        status: 'success',
        paymentId: 'pay_12345678',
        createdAt: new Date().toISOString(),
      },
    ];

    render(<TransactionTable transactions={mockTxs} />);

    expect(screen.getByText('Starter Top-Up')).toBeInTheDocument();
    expect(screen.getByText('₹49')).toBeInTheDocument();
    expect(screen.getByText('+500')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('pay_12345678')).toBeInTheDocument();
  });

  it('opens receipt modal when row or Receipt button is clicked', () => {
    const mockTxs = [
      {
        _id: 'tx_rec_1',
        planId: 'starter_pack',
        amountINR: 49,
        creditsAdded: 500,
        status: 'success',
        paymentId: 'pay_rec_test',
        createdAt: new Date().toISOString(),
      },
    ];

    render(<TransactionTable transactions={mockTxs} />);

    const receiptBtn = screen.getByRole('button', { name: /receipt/i });
    fireEvent.click(receiptBtn);

    expect(screen.getByText('Transaction Receipt')).toBeInTheDocument();
  });

  it('filters transactions when status filter buttons are clicked', () => {
    const mockTxs = [
      {
        _id: 'tx_succ',
        planId: 'starter_pack',
        amountINR: 49,
        creditsAdded: 500,
        status: 'success',
        paymentId: 'pay_succ',
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'tx_pend',
        planId: 'pro_pack',
        amountINR: 99,
        creditsAdded: 1200,
        status: 'pending',
        orderId: 'order_pend',
        createdAt: new Date().toISOString(),
      },
    ];

    render(<TransactionTable transactions={mockTxs} />);

    expect(screen.getByText('Starter Top-Up')).toBeInTheDocument();
    expect(screen.getByText('Pro Developer Pack')).toBeInTheDocument();

    const successFilterBtn = screen.getByRole('button', { name: /^success/i });
    fireEvent.click(successFilterBtn);

    expect(screen.getByText('Starter Top-Up')).toBeInTheDocument();
    expect(screen.queryByText('Pro Developer Pack')).not.toBeInTheDocument();
  });
});
