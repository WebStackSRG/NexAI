import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VoiceRipple } from './VoiceRipple';

describe('VoiceRipple Component', () => {
  it('renders idle standby state with correct accessibility label', () => {
    render(<VoiceRipple isSpeaking={false} source="idle" />);
    const region = screen.getByRole('region');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute(
      'aria-label',
      'Standby - Listening for speech or response',
    );
  });

  it('renders interviewer active speaking state with accessible label', () => {
    render(
      <VoiceRipple
        isSpeaking={true}
        source="interviewer"
        statusText="Interviewer speaking"
      />,
    );
    const region = screen.getByRole('region');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-label', 'Interviewer speaking');
    expect(screen.getByText('Interviewer speaking')).toBeInTheDocument();
  });

  it('renders candidate active speaking state', () => {
    render(
      <VoiceRipple
        isSpeaking={true}
        source="candidate"
        statusText="Candidate speaking"
      />,
    );
    const region = screen.getByRole('region');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute(
      'aria-label',
      'Candidate speaking into microphone',
    );
  });
});
