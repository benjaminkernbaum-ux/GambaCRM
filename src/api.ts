/**
 * API helper — calls the dashboard_server.py Python backend.
 * All endpoints are relative (/api/...) so they work both locally
 * (via Vite proxy → localhost:8080) and when the server serves the
 * built React app directly.
 * Falls back to `null` gracefully when the backend is not available
 * (e.g. Vercel static deployment).
 */

const HDR = { 'Content-Type': 'application/json' };

async function call<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`/api${path}`, { ...options, headers: { ...HDR, ...options?.headers } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ─── Agent process status ─────────────────────────────────────────────────────

export interface AgentProcess {
  id:      string;
  running: boolean;
  uptime?: string;
  pid?:    number;
  lastLog?: string;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const api = {
  /** GET /api/status — all CRM metrics from JSON status files */
  status: ()               => call<Record<string, unknown>>('/status'),

  /** GET /api/agents — process manager status per agent */
  agents: ()               => call<Record<string, AgentProcess>>('/agents'),

  /** POST /api/agent/start  {agent: "crm_sync"|"whatsapp_sync"|"wa_reply"} */
  start:  (agent: string)  => call<{ ok: boolean; message?: string }>('/agent/start',   { method: 'POST', body: JSON.stringify({ agent }) }),

  /** POST /api/agent/stop */
  stop:   (agent: string)  => call<{ ok: boolean }>('/agent/stop',    { method: 'POST', body: JSON.stringify({ agent }) }),

  /** POST /api/agent/restart */
  restart:(agent: string)  => call<{ ok: boolean }>('/agent/restart', { method: 'POST', body: JSON.stringify({ agent }) }),

  /** POST /api/launch_suite — starts CRM Sync + opens Chrome analytics tabs */
  launchSuite: ()          => call<{ ok: boolean; message?: string }>('/launch_suite', { method: 'POST' }),

  /** GET /api/whatsapp_stats */
  waStats: ()              => call<Record<string, unknown>>('/whatsapp_stats'),

  /** GET /api/wa_inbox */
  waInbox: ()              => call<unknown[]>('/wa_inbox'),

  /** GET /api/wa_reply_status */
  waReplyStatus: ()        => call<Record<string, unknown>>('/wa_reply_status'),

  /** GET /api/session — today's processed leads count */
  session: ()              => call<{ count: number }>('/session'),

  /** GET /api/dialer_stats */
  dialerStats: ()          => call<Record<string, unknown>>('/dialer_stats'),
};
