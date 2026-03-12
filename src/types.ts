import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── CRM Pipeline / GAMBA Segments ───────────────────────────────────────────

export type SegmentKey =
  | 'DOCS_VERIFIED'
  | 'PIX_READY'
  | 'NEW_LEAD'
  | 'WELCOME_NEW_REG'
  | 'DOCS_UNDER_REVIEW'
  | 'DOCS_PENDING'
  | 'NO_ANSWER'
  | 'SUCCESSFUL_CONTACT'
  | 'SKIP_COOLDOWN'
  | 'FAILED_DEPOSIT'
  | 'HIGH_INTENT_DEPOSIT'
  | 'MARGIN_CALL'
  | 'STOP_OUT'
  | 'REJECT_SCREENSHOT'
  | 'REJECT_MISSING_SIDE'
  | 'REJECT_BW'
  | 'REJECT_NAME_MISMATCH'
  | 'REJECT_EXPIRED'
  | 'SKIP_CLOSED'
  | 'SKIP_ACTIVE'
  | 'REASSIGNED'
  | 'REASSIGNED_2';

export interface SegmentMeta {
  key: SegmentKey;
  icon: string;
  color: string;
  label: string;
  group: 'hot' | 'funnel' | 'compliance' | 'risk' | 'skip';
}

export const SEG_META: SegmentMeta[] = [
  { key: 'HIGH_INTENT_DEPOSIT', icon: '🔥', color: '#f97316', label: 'High Intent',            group: 'hot' },
  { key: 'PIX_READY',           icon: '💳', color: '#22c55e', label: 'PIX Ready',               group: 'hot' },
  { key: 'NEW_LEAD',            icon: '⚡', color: '#3b82f6', label: 'New Lead',                group: 'funnel' },
  { key: 'WELCOME_NEW_REG',     icon: '👋', color: '#8b5cf6', label: 'New Registration',        group: 'funnel' },
  { key: 'SUCCESSFUL_CONTACT',  icon: '📞', color: '#06b6d4', label: 'Successful Contact',      group: 'funnel' },
  { key: 'NO_ANSWER',           icon: '🔇', color: '#64748b', label: 'No Answer',               group: 'funnel' },
  { key: 'DOCS_PENDING',        icon: '📋', color: '#a78bfa', label: 'Docs Pending',            group: 'compliance' },
  { key: 'DOCS_UNDER_REVIEW',   icon: '🔍', color: '#fbbf24', label: 'Under Review',            group: 'compliance' },
  { key: 'DOCS_VERIFIED',       icon: '✅', color: '#00FF00', label: 'Docs Verified',           group: 'compliance' },
  { key: 'REJECT_SCREENSHOT',   icon: '📸', color: '#f87171', label: 'Rejected: Screenshot',    group: 'compliance' },
  { key: 'REJECT_MISSING_SIDE', icon: '📄', color: '#f87171', label: 'Rejected: Missing Side',  group: 'compliance' },
  { key: 'REJECT_BW',           icon: '🖤', color: '#f87171', label: 'Rejected: B&W',           group: 'compliance' },
  { key: 'REJECT_NAME_MISMATCH',icon: '🔀', color: '#f87171', label: 'Rejected: Name Mismatch', group: 'compliance' },
  { key: 'REJECT_EXPIRED',      icon: '⏰', color: '#f87171', label: 'Rejected: Expired',       group: 'compliance' },
  { key: 'FAILED_DEPOSIT',      icon: '💸', color: '#ef4444', label: 'Failed Deposit',          group: 'risk' },
  { key: 'MARGIN_CALL',         icon: '⚠️', color: '#f59e0b', label: 'Margin Call',             group: 'risk' },
  { key: 'STOP_OUT',            icon: '🛑', color: '#dc2626', label: 'Stop Out',                group: 'risk' },
  { key: 'REASSIGNED',          icon: '🔄', color: '#818cf8', label: 'Reassigned',              group: 'skip' },
  { key: 'REASSIGNED_2',        icon: '🔁', color: '#c084fc', label: 'Reassigned+',             group: 'skip' },
  { key: 'SKIP_COOLDOWN',       icon: '⏳', color: '#475569', label: 'Cooldown',                group: 'skip' },
  { key: 'SKIP_CLOSED',         icon: '🚫', color: '#334155', label: 'Closed',                  group: 'skip' },
  { key: 'SKIP_ACTIVE',         icon: '💬', color: '#25d366', label: 'Active WA',               group: 'skip' },
];

export const SEG_GROUPS: { key: SegmentMeta['group']; label: string; color: string }[] = [
  { key: 'hot',        label: 'Hot Leads',     color: '#f97316' },
  { key: 'funnel',     label: 'Sales Funnel',  color: '#3b82f6' },
  { key: 'compliance', label: 'Compliance',    color: '#fbbf24' },
  { key: 'risk',       label: 'Risk',          color: '#ef4444' },
  { key: 'skip',       label: 'Skip / Closed', color: '#475569' },
];

export interface PipelineLead {
  id: string;
  crmId: string;
  name: string;
  email: string;
  phone: string;
  segment: SegmentKey;
  channel: 'email' | 'wa';
  stage: 'STAGE_1' | 'STAGE_2' | 'STAGE_3';
  assignedTo: string;
  updatedAt: string;
  depositAmount?: number;
}

// ─── GAMBA CRM dataset (~719 leads) ──────────────────────────────────────────

const _FIRST = [
  'Carlos','Ana','Marcos','Julia','Pedro','Fernanda','Lucas','Beatriz','Ricardo','Camila',
  'Bruno','Patricia','Eduardo','Daniela','Thiago','Larissa','Felipe','Mariana','Rafael','Isabela',
  'André','Vanessa','Gustavo','Leticia','Diego','Amanda','Rodrigo','Carolina','Leonardo','Priscila',
  'Gabriel','Aline','Matheus','Renata','Victor','Natalia','Henrique','Juliana','Alexandre','Monica',
  'Daniel','Claudia','Paulo','Sonia','Roberto','Luciana','Sergio','Eliane','Fábio','Cristina',
];
const _LAST = [
  'Silva','Souza','Lima','Costa','Alves','Rocha','Martins','Santos','Ferreira','Oliveira',
  'Carvalho','Nunes','Vieira','Borges','Mendes','Barbosa','Pinto','Moreira','Castro','Pereira',
  'Cardoso','Nascimento','Araújo','Ribeiro','Gomes','Teixeira','Correia','Machado','Rezende','Brito',
];
export const AGENTS = ['Benjamin', 'Sistema', 'Unassigned'];
const _DOMAINS = ['gmail.com','hotmail.com','yahoo.com.br','outlook.com','icloud.com'];
const _DDD     = ['11','21','31','41','51','61','71','81','85','92'];

const _DIST: [SegmentKey, number][] = [
  ['DOCS_VERIFIED',       128],
  ['REASSIGNED_2',         85],
  ['SKIP_ACTIVE',          76],
  ['NEW_LEAD',             58],
  ['REASSIGNED',           45],
  ['WELCOME_NEW_REG',      38],
  ['SUCCESSFUL_CONTACT',   31],
  ['DOCS_PENDING',         27],
  ['NO_ANSWER',            25],
  ['DOCS_UNDER_REVIEW',    24],
  ['SKIP_COOLDOWN',        22],
  ['HIGH_INTENT_DEPOSIT',  22],
  ['PIX_READY',            21],
  ['REJECT_SCREENSHOT',    19],
  ['SKIP_CLOSED',          16],
  ['REJECT_MISSING_SIDE',  15],
  ['FAILED_DEPOSIT',       14],
  ['REJECT_BW',            13],
  ['REJECT_NAME_MISMATCH', 13],
  ['REJECT_EXPIRED',       11],
  ['MARGIN_CALL',          10],
  ['STOP_OUT',              6],
]; // total = 719

function _buildLeads(): PipelineLead[] {
  const leads: PipelineLead[] = [];
  const DEP_SEGS = new Set<SegmentKey>(['DOCS_VERIFIED','HIGH_INTENT_DEPOSIT','PIX_READY','FAILED_DEPOSIT','MARGIN_CALL','STOP_OUT']);
  let id = 0;
  for (const [seg, count] of _DIST) {
    for (let i = 0; i < count; i++) {
      const n  = id;
      const fi = (n * 7  + i * 3)  % _FIRST.length;
      const li = (n * 13 + i * 5)  % _LAST.length;
      const di = (n * 3  + i * 7)  % _DDD.length;
      const hh = String((n * 11 + i * 3) % 24).padStart(2, '0');
      const mm = String((n * 17 + i * 7) % 60).padStart(2, '0');
      const ai = (n * 5  + i * 11) % AGENTS.length;
      const p1 = 9000 + ((n * 97  + i * 53) % 1000);
      const p2 = 1000 + ((n * 113 + i * 67) % 9000);
      const dep = DEP_SEGS.has(seg) ? 500 + ((n * 251 + i * 173) % 49500) : undefined;
      const crmId      = String(540001 + n);
      const emailUser  = `${_FIRST[fi].toLowerCase().replace(/[^a-z]/g, '')}${n + 1}`;
      const emailDomain = _DOMAINS[(n * 7 + i * 5) % _DOMAINS.length];
      const channel: 'email' | 'wa' = (n * 3 + i * 7) % 4 === 0 ? 'wa' : 'email';
      const stageRaw = (n * 7 + i * 13) % 10;
      const stage: 'STAGE_1' | 'STAGE_2' | 'STAGE_3' =
        stageRaw < 3 ? 'STAGE_1' : stageRaw < 7 ? 'STAGE_2' : 'STAGE_3';
      leads.push({
        id: String(n + 1), crmId,
        name: `${_FIRST[fi]} ${_LAST[li]}`,
        email: `${emailUser}@${emailDomain}`,
        phone: `+55 ${_DDD[di]} 9${p1}-${p2}`,
        segment: seg, channel, stage,
        assignedTo: AGENTS[ai],
        updatedAt: `${hh}:${mm}`,
        depositAmount: dep,
      });
      id++;
    }
  }
  return leads;
}

export const MOCK_LEADS: PipelineLead[] = _buildLeads();
