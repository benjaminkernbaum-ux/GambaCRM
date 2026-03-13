import type { VercelRequest, VercelResponse } from '@vercel/node';
import { proxyOrMock } from './_proxy';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const { data } = await proxyOrMock('/session', { count: 312 });
  res.json(data);
}
