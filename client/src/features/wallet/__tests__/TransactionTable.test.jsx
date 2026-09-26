import { render, screen } from '@testing-library/react';
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
});
