import type { VercelRequest, VercelResponse } from '@vercel/node';
import { proxyOrMock } from './_proxy';

const MOCK = {
  calls_today: 87,
  connected: 54,
  voicemail: 18,
  no_answer: 15,
  avg_duration_sec: 142,
  conversion_rate: 0.14,
};

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const { data } = await proxyOrMock('/dialer_stats', MOCK);
  res.json(data);
}
