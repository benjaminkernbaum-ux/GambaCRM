import type { VercelRequest, VercelResponse } from '@vercel/node';
import { proxyOrMock } from '../_proxy';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  const { data } = await proxyOrMock('/agent/stop', { ok: true }, {
    method: 'POST',
    body: JSON.stringify(req.body ?? {}),
  });
  res.json(data);
}
