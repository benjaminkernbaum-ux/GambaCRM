import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  res.json({
    ok: true,
    message: 'Suite launched — CRM Sync + WhatsApp agents active',
  });
}
