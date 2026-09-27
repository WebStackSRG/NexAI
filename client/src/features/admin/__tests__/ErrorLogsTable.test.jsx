import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ErrorLogsTable } from '../ErrorLogsTable';

describe('ErrorLogsTable Component', () => {
  const mockErrors = [
    {
      _id: 'err_1',
      createdAt: '2026-09-20T10:00:00Z',
      method: 'POST',
      route: '/api/chats',
      status: 500,
      message: 'Database query timeout',
      stack: 'Error: Database query timeout\n    at query (db.js:10:5)',
    },
  ];

  it('renders error telemetry rows and method/status badges', () => {
    render(
      <ErrorLogsTable
        errors={mockErrors}
        total={1}
        page={1}
        totalPages={1}
        isLoading={false}
      />,
    );

    expect(screen.getByText('System Error Telemetry')).toBeInTheDocument();
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText('/api/chats')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Database query timeout')).toBeInTheDocument();
  });

  it('toggles stack trace preview when Trace button is clicked', () => {
    render(
      <ErrorLogsTable
        errors={mockErrors}
        total={1}
        page={1}
        totalPages={1}
        isLoading={false}
      />,
    );

    const traceBtn = screen.getByRole('button', { name: /toggle stack trace/i });
    fireEvent.click(traceBtn);

    expect(screen.getByText(/Stack Trace \(\/api\/chats\)/i)).toBeInTheDocument();
    expect(screen.getByText(/at query \(db\.js:10:5\)/i)).toBeInTheDocument();
  });
});
