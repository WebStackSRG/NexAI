import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecentTransactionsTable } from '../RecentTransactionsTable';

describe('RecentTransactionsTable Component', () => {
  const mockTransactions = [
    {
      _id: 'tx_1',
      createdAt: '2026-09-20T10:00:00Z',
      userId: { email: 'user@example.com' },
      orderId: 'order_123',
      amountINR: 499,
      creditsAdded: 500,
      status: 'success',
    },
  ];

  it('renders transactions table with rows and status badges', () => {
    render(
      <RecentTransactionsTable
        transactions={mockTransactions}
        total={1}
        page={1}
        totalPages={1}
        isLoading={false}
      />,
    );

    expect(screen.getByText('Platform Recharges')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText('₹499')).toBeInTheDocument();
    expect(screen.getByText('+500')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('triggers pagination change on next button click', () => {
    const handlePageChange = vi.fn();

    render(
      <RecentTransactionsTable
        transactions={mockTransactions}
        total={20}
        page={1}
        totalPages={2}
        isLoading={false}
        onPageChange={handlePageChange}
      />,
    );

    const nextBtn = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn);

    expect(handlePageChange).toHaveBeenCalledWith(2);
  });
});
