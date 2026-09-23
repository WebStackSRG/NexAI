import { isDbConnected } from '../config/db.js';

export function getHealth(req, res) {
  res.status(200).json({
    data: {
      status: 'ok',
      db: isDbConnected() ? 'connected' : 'disconnected',
      uptime: Number(process.uptime().toFixed(2)),
    },
  });
}
