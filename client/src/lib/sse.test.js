import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseSseStream, streamChatMessage, sanitizeErrorMessage } from './sse';
import { useAuthStore } from '@/store/authStore';

// Helper to create a ReadableStream from string chunks
function createMockStream(chunks) {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });
}

describe('SSE Stream Parser (parseSseStream)', () => {
  it('parses token events correctly', async () => {
    const onToken = vi.fn();
    const onDone = vi.fn();

    const stream = createMockStream([
      'event: token\ndata: {"text":"Hello "}\n\n',
      'event: token\ndata: {"text":"world!"}\n\n',
    ]);

    await parseSseStream(stream, { onToken, onDone });

    expect(onToken).toHaveBeenCalledTimes(2);
    expect(onToken).toHaveBeenNthCalledWith(1, 'Hello ');
    expect(onToken).toHaveBeenNthCalledWith(2, 'world!');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('parses done event with credit and token metadata', async () => {
    const onToken = vi.fn();
    const onDone = vi.fn();

    const donePayload = {
      messageId: 'msg-456',
      tokensUsed: 120,
      creditsDeducted: 2,
      creditsRemaining: 98,
      chatTitle: 'AI Overview',
    };

    const stream = createMockStream([
      'event: token\ndata: {"text":"Done content"}\n\n',
      `event: done\ndata: ${JSON.stringify(donePayload)}\n\n`,
    ]);

    await parseSseStream(stream, { onToken, onDone });

    expect(onToken).toHaveBeenCalledWith('Done content');
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith(donePayload);
  });

  it('parses error events correctly', async () => {
    const onError = vi.fn();

    const stream = createMockStream([
      'event: error\ndata: {"code":"RATE_LIMIT","message":"Too many requests"}\n\n',
    ]);

    await parseSseStream(stream, { onError });

    expect(onError).toHaveBeenCalledWith({
      code: 'RATE_LIMIT',
      message: 'Too many requests',
    });
  });

  it('handles fragmented chunks split across network frames', async () => {
    const onToken = vi.fn();
    const onDone = vi.fn();

    // Data split in the middle of lines and JSON
    const stream = createMockStream([
      'event: to',
      'ken\nda',
      'ta: {"text":"Fragmented',
      ' text"}\n\n',
      'event: done\ndata: {"creditsRemaining":99}\n\n',
    ]);

    await parseSseStream(stream, { onToken, onDone });

    expect(onToken).toHaveBeenCalledWith('Fragmented text');
    expect(onDone).toHaveBeenCalledWith({ creditsRemaining: 99 });
  });

  it('handles CRLF (\\r\\n) line endings and ignores SSE comments', async () => {
    const onToken = vi.fn();

    const stream = createMockStream([
      ': ping comment\r\n',
      'event: token\r\ndata: {"text":"Line 1"}\r\n\r\n',
      ': another comment\r\n',
    ]);

    await parseSseStream(stream, { onToken });

    expect(onToken).toHaveBeenCalledWith('Line 1');
  });
});

describe('streamChatMessage API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ accessToken: 'test-token-xyz' });
  });

  it('handles 402 INSUFFICIENT_CREDITS response and calls onError', async () => {
    const onError = vi.fn();

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 402,
      ok: false,
      json: async () => ({
        error: { code: 'INSUFFICIENT_CREDITS', message: 'Recharge to continue' },
      }),
    });

    await expect(
      streamChatMessage({
        chatId: 'chat-1',
        content: 'Hi',
        onError,
      }),
    ).rejects.toMatchObject({
      status: 402,
      code: 'INSUFFICIENT_CREDITS',
      message: 'Recharge to continue',
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 402,
        code: 'INSUFFICIENT_CREDITS',
      }),
    );
  });

  it('handles generic non-ok HTTP responses', async () => {
    const onError = vi.fn();

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 500,
      ok: false,
      statusText: 'Internal Server Error',
      json: async () => ({
        error: { code: 'SERVER_ERROR', message: 'Gemini service unreachable' },
      }),
    });

    await expect(
      streamChatMessage({
        chatId: 'chat-1',
        content: 'Hi',
        onError,
      }),
    ).rejects.toMatchObject({
      status: 500,
      code: 'SERVER_ERROR',
      message: 'Gemini service unreachable',
    });

    expect(onError).toHaveBeenCalled();
  });
});

describe('sanitizeErrorMessage utility', () => {
  it('unwraps nested stringified JSON errors', () => {
    const inner = JSON.stringify({
      error: {
        code: 503,
        message:
          'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.',
        status: 'UNAVAILABLE',
      },
    });
    const outer = JSON.stringify({
      error: {
        message: inner,
        code: 503,
        status: 'Service Unavailable',
      },
    });

    const sanitized = sanitizeErrorMessage(outer);
    expect(sanitized).toBe(
      'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.',
    );
  });

  it('preserves clean string messages without changes', () => {
    expect(sanitizeErrorMessage('Network connection lost')).toBe('Network connection lost');
  });

  it('handles null and undefined gracefully', () => {
    expect(sanitizeErrorMessage(null)).toBe('An error occurred');
    expect(sanitizeErrorMessage(undefined)).toBe('An error occurred');
  });
});
