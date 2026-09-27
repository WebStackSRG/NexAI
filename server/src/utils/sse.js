/**
 * Server-Sent Events (SSE) utilities for streaming responses to the client.
 */

/**
 * Prepares HTTP response headers for SSE streaming.
 * @param {import('express').Response} res
 */
export function setupSse(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
}

/**
 * Sends a typed event and payload down an open SSE stream.
 * @param {import('express').Response} res
 * @param {string} event - Event name (e.g. 'token', 'done', 'error')
 * @param {Record<string, unknown>} data - Serialized payload
 */
export function sendSse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  if (typeof res.flush === 'function') {
    res.flush();
  }
}

/**
 * Closes an open SSE response stream cleanly.
 * @param {import('express').Response} res
 */
export function closeSse(res) {
  res.end();
}
