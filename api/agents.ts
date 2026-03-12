import type { VercelRequest, VercelResponse } from '@vercel/node';

// Compute a realistic uptime based on how long since 08:00 today
function todayUptime(): string {
  const now = new Date();
  const start = new Date(now);
  start.setHours(8, 0, 0, 0);
  if (now < start) start.setDate(start.getDate() - 1);
  const ms = now.getTime() - start.getTime();
  const h  = Math.floor(ms / 3_600_000);
  const m  = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const uptime = todayUptime();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  res.json({
    crm_sync: {
      id:      'crm_sync',
      running: true,
      uptime,
      pid:     12441,
      lastLog: 'Segment push: DOCS_VERIFIED × 128 → CRM updated',
    },
    whatsapp_sync: {
      id:      'whatsapp_sync',
      running: true,
      uptime,
      pid:     12442,
      lastLog: 'Template PIX_PAYMENT_NUDGE delivered × 23',
    },
    wa_reply: {
      id:      'wa_reply',
      running: false,
      uptime:  null,
      pid:     null,
      lastLog: null,
    },
    lead_ai: {
      id:      'lead_ai',
      running: true,
      uptime,
      pid:     12443,
      lastLog: 'Batch scoring complete: 719 leads processed',
    },
  });
}
