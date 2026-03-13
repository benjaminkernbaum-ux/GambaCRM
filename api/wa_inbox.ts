import type { VercelRequest, VercelResponse } from '@vercel/node';
import { proxyOrMock } from './_proxy';

const now = Date.now();
const MOCK = [
  { id: 'msg_001', from: '+55 11 99123-4567', name: 'Carlos Silva',    text: 'Boa tarde, já enviei os documentos',          ts: now - 3 * 60_000,  read: false },
  { id: 'msg_002', from: '+55 21 98765-4321', name: 'Ana Souza',       text: 'Quando vou receber o retorno?',                ts: now - 11 * 60_000, read: false },
  { id: 'msg_003', from: '+55 31 97654-3210', name: 'Marcos Lima',     text: 'Quero fazer um depósito, me ajuda?',           ts: now - 22 * 60_000, read: true  },
  { id: 'msg_004', from: '+55 41 96543-2109', name: 'Julia Costa',     text: 'Meu documento foi aprovado?',                  ts: now - 45 * 60_000, read: true  },
  { id: 'msg_005', from: '+55 51 95432-1098', name: 'Pedro Alves',     text: 'Preciso falar com um atendente',               ts: now - 67 * 60_000, read: true  },
];

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const { data } = await proxyOrMock('/wa_inbox', MOCK);
  res.json(data);
}
