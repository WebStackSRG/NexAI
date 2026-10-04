import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CreditBadge } from '../CreditBadge';

describe('CreditBadge Component', () => {
  it('renders credit count and credits label', () => {
    render(<CreditBadge credits={250} />);
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText(/credits/i)).toBeInTheDocument();
  });

  it('triggers onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<CreditBadge credits={100} onClick={handleClick} />);

    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('adds low-balance class when credits are 20 or below', () => {
    const { container } = render(<CreditBadge credits={15} />);
    const btn = container.querySelector('button');
    expect(btn.className).toMatch(/low/);
  });
});
