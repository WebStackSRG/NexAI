import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VariableFillModal } from './VariableFillModal';

describe('VariableFillModal Component', () => {
  const mockPromptWithVars = {
    _id: 'p1',
    title: 'Code Analyzer',
    template: 'Analyze the following {{language}} code:\n\n{{code}}',
    variables: ['language', 'code'],
  };

  const mockStaticPrompt = {
    _id: 'p2',
    title: 'Greeting Prompt',
    template: 'Hello NexAI, please introduce yourself.',
    variables: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input fields for each detected variable and shows live template preview', () => {
    render(
      <VariableFillModal
        open={true}
        onClose={vi.fn()}
        prompt={mockPromptWithVars}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText('Use Prompt: Code Analyzer')).toBeInTheDocument();
    expect(screen.getByText('{{language}}')).toBeInTheDocument();
    expect(screen.getByText('{{code}}')).toBeInTheDocument();
    expect(screen.getByText(/Analyze the following \{\{language\}\} code/i)).toBeInTheDocument();
  });

  it('updates the live preview as the user types variable values', () => {
    render(
      <VariableFillModal
        open={true}
        onClose={vi.fn()}
        prompt={mockPromptWithVars}
        onConfirm={vi.fn()}
      />,
    );

    const langInput = screen.getByPlaceholderText('Enter value for language...');
    fireEvent.change(langInput, { target: { value: 'JavaScript' } });

    const codeInput = screen.getByPlaceholderText('Enter value for code...');
    fireEvent.change(codeInput, { target: { value: 'console.log("hello");' } });

    expect(
      screen.getByText((_, element) => {
        return (
          element?.tagName?.toLowerCase() === 'pre' &&
          element.textContent.includes('JavaScript') &&
          element.textContent.includes('console.log("hello");')
        );
      }),
    ).toBeInTheDocument();
  });

  it('calls onConfirm with the compiled string and closes modal when action button is clicked', () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <VariableFillModal
        open={true}
        onClose={handleClose}
        prompt={mockPromptWithVars}
        onConfirm={handleConfirm}
        actionLabel="Insert into Chat"
      />,
    );

    const langInput = screen.getByPlaceholderText('Enter value for language...');
    fireEvent.change(langInput, { target: { value: 'Python' } });

    const insertBtn = screen.getByRole('button', { name: /insert into chat/i });
    fireEvent.click(insertBtn);

    expect(handleConfirm).toHaveBeenCalledWith(
      'Analyze the following Python code:\n\n{{code}}',
    );
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders notice for static prompts with no dynamic variables', () => {
    render(
      <VariableFillModal
        open={true}
        onClose={vi.fn()}
        prompt={mockStaticPrompt}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/this prompt has no dynamic variables and is ready to insert directly/i),
    ).toBeInTheDocument();
  });
});
