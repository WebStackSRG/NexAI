import { isDbConnected } from '../config/db.js';

export function getHealth(req, res) {
  const connected = isDbConnected();
  const statusCode = connected ? 200 : 503;

  res.status(statusCode).json({
    data: {
      status: connected ? 'ok' : 'degraded',
      db: connected ? 'connected' : 'disconnected',
      uptime: Number(process.uptime().toFixed(2)),
    },
  });
}
