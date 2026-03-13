import type { VercelRequest, VercelResponse } from '@vercel/node';
import { proxyOrMock } from './_proxy';

const MOCK = {
  running: false,
  auto_reply_enabled: false,
  pending_replies: 7,
  replied_today: 19,
  last_reply_at: null,
};

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const { data } = await proxyOrMock('/wa_reply_status', MOCK);
  res.json(data);
}
