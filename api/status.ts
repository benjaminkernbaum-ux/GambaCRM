import type { VercelRequest, VercelResponse } from '@vercel/node';
import { proxyOrMock } from './_proxy';

const MOCK = {
  total_leads: 719,
  today_processed: 312,
  segments: {
    DOCS_VERIFIED: 128, PIX_READY: 21, HIGH_INTENT_DEPOSIT: 22,
    NEW_LEAD: 58, WELCOME_NEW_REG: 38, SUCCESSFUL_CONTACT: 31,
    NO_ANSWER: 25, DOCS_PENDING: 27, DOCS_UNDER_REVIEW: 24,
    FAILED_DEPOSIT: 14, MARGIN_CALL: 10, STOP_OUT: 6,
    SKIP_COOLDOWN: 22, SKIP_CLOSED: 16, SKIP_ACTIVE: 76,
    REASSIGNED: 45, REASSIGNED_2: 85,
    REJECT_SCREENSHOT: 19, REJECT_MISSING_SIDE: 15,
    REJECT_BW: 13, REJECT_NAME_MISMATCH: 13, REJECT_EXPIRED: 11,
  },
  last_sync: new Date().toISOString(),
};

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const { data } = await proxyOrMock('/status', MOCK);
  res.json(data);
}
