import type { VercelRequest, VercelResponse } from '@vercel/node';
import { proxyOrMock } from './_proxy';

const MOCK = {
  messages_sent_today: 287,
  messages_delivered: 271,
  messages_read: 198,
  replies_received: 43,
  templates: {
    PIX_PAYMENT_NUDGE: { sent: 98, delivered: 94, read: 72 },
    DOCS_REQUEST:      { sent: 87, delivered: 81, read: 59 },
    WELCOME_MSG:       { sent: 66, delivered: 64, read: 51 },
    FOLLOW_UP:         { sent: 36, delivered: 32, read: 16 },
  },
  active_sessions: 12,
  queued: 34,
};

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const { data } = await proxyOrMock('/whatsapp_stats', MOCK);
  res.json(data);
}
