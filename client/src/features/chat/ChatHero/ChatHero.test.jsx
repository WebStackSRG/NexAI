import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatHero } from './ChatHero';
import { useChatStore } from '@/store/chatStore';

describe('ChatHero Component', () => {
  beforeEach(() => {
    useChatStore.setState({
      selectedModel: 'flash',
      setSelectedModel: vi.fn((m) => useChatStore.setState({ selectedModel: m })),
      insufficientCredits: false,
      isStreaming: false,
    });
  });

  it('renders Gemini-inspired hero headline, subtitle, and input card', () => {
    render(<ChatHero onSendPrompt={vi.fn()} />);

    expect(screen.getByText('Where should we start?')).toBeInTheDocument();
    expect(
      screen.getByText(/select a model, type a prompt, or use starter suggestions to begin/i),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/select ai model/i)).toBeInTheDocument();
    expect(screen.getByText('Gemini 3.8 Flash')).toBeInTheDocument();
    expect(screen.getByLabelText(/ask nexai anything/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/attach context file/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/voice input not supported in this browser/i)).toBeInTheDocument();
  });

  it('renders starter prompt suggestion chips and triggers callback when clicked', () => {
    const handleSendPrompt = vi.fn();
    render(<ChatHero onSendPrompt={handleSendPrompt} />);

    expect(screen.getByText('Explain a Concept')).toBeInTheDocument();
    expect(screen.getByText('Code Assistance')).toBeInTheDocument();
    expect(screen.getByText('Professional Writing')).toBeInTheDocument();
    expect(screen.getByText('System Architecture')).toBeInTheDocument();

    const conceptChip = screen.getByRole('button', { name: /explain a concept/i });
    fireEvent.click(conceptChip);

    expect(handleSendPrompt).toHaveBeenCalledWith(
      'Explain quantum computing in simple, intuitive terms.',
    );
  });

  it('submits text input on form submission', () => {
    const handleSendPrompt = vi.fn();
    render(<ChatHero onSendPrompt={handleSendPrompt} />);

    const textarea = screen.getByLabelText(/ask nexai anything/i);
    fireEvent.change(textarea, { target: { value: 'How does an event loop work in Node.js?' } });

    const sendBtn = screen.getByLabelText(/send prompt/i);
    expect(sendBtn).not.toBeDisabled();

    fireEvent.click(sendBtn);

    expect(handleSendPrompt).toHaveBeenCalledWith('How does an event loop work in Node.js?');
    expect(textarea.value).toBe('');
  });

  it('submits on Enter keypress without Shift', () => {
    const handleSendPrompt = vi.fn();
    render(<ChatHero onSendPrompt={handleSendPrompt} />);

    const textarea = screen.getByLabelText(/ask nexai anything/i);
    fireEvent.change(textarea, { target: { value: 'Explain closures' } });

    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(handleSendPrompt).toHaveBeenCalledWith('Explain closures');
  });

  it('switches AI model selection via dropdown', () => {
    render(<ChatHero onSendPrompt={vi.fn()} />);

    const modelTrigger = screen.getByLabelText(/select ai model/i);
    fireEvent.click(modelTrigger);

    const proOption = screen.getByText(/gemini 3.1 pro/i);
    fireEvent.click(proOption);

    expect(useChatStore.getState().setSelectedModel).toHaveBeenCalledWith('pro');
  });
});
