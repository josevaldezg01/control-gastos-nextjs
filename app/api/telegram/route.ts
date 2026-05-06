import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// ─── Tablas de parsing ────────────────────────────────────────────────────────

const BANCO_MAP: Record<string, string> = {
  nequi: 'Nequi', equin: 'Nequi', nequy: 'Nequi', nequis: 'Nequi',
  neki: 'Nequi', nekki: 'Nequi', nekking: 'Nequi', neking: 'Nequi',
  nequin: 'Nequi', nequing: 'Nequi', neky: 'Nequi', necki: 'Nequi',
  daviplata: 'Daviplata', davi: 'Daviplata', daviplatah: 'Daviplata',
  efectivo: 'Efectivo', efecto: 'Efectivo',
  bogota: 'Banco de Bogotá', bdb: 'Banco de Bogotá',
  colpatria: 'Colpatria', scotiabank: 'Colpatria', scotia: 'Colpatria',
  bolsillo: 'Bolsillo',
  comfandi: 'Subsidio Comfandi', confandi: 'Subsidio Comfandi',
  bancolombia: 'Bancolombia',
  prestamo: 'Préstamos', prestamos: 'Préstamos',
};

const BANCO_FINGERPRINTS: [string, string[]][] = [
  ['Nequi',             ['nequ', 'equi', 'nekk', 'nek']],
  ['Daviplata',         ['davi']],
  ['Bancolombia',       ['olom', 'banc']],
  ['Colpatria',         ['colp']],
  ['Bolsillo',          ['bols']],
  ['Subsidio Comfandi', ['comf', 'confan']],
  ['Banco de Bogotá',   ['bogo']],
  ['Efectivo',          ['efec']],
];

const FILLER_WORDS = new Set([
  'en', 'de', 'por', 'con', 'para', 'a', 'al', 'del',
  'el', 'la', 'los', 'las', 'un', 'una', 'y', 'via',
  'pesos', 'peso',
  'the', 'and', 'of',
  'gaste', 'compre', 'pague', 'gasto', 'pago', 'use', 'utilize', 'saque',
  'banco',
]);

const INGRESO_SINGLE_WORDS = new Set([
  'ingreso', 'ingresos', 'recibi', 'cobre', 'cobro', 'cobros', 'entrada', 'entradas',
]);

const INGRESO_KEYWORDS = new Set([
  'ingreso', 'ingresos', 'recibi', 'cobre', 'cobro', 'entrada', 'entradas', 'me pagaron',
]);

const IMPLICIT_INGRESO_KEYWORDS = new Set([
  'netflix', 'hbo', 'amazon', 'youtube', 'prime', 'disney', 'max',
]);

const STREAMING_KEYWORDS = new Set([
  'netflix', 'hbo', 'amazon', 'youtube', 'prime', 'disney', 'max', 'streaming', 'cuenta',
]);

const MULTIPLIERS: Record<string, number> = {
  mil: 1_000, miles: 1_000, millon: 1_000_000, millones: 1_000_000,
};

const CATEGORY_MAP: Record<string, string> = {
  almuerzo: 'Almuerzo', almuerzos: 'Almuerzo',
  comida: 'Comida', cena: 'Comida', desayuno: 'Comida', restaurante: 'Comida',
  mercado: 'Comida', supermercado: 'Comida', domicilio: 'Comida',
  mecato: 'Mecato', snack: 'Mecato',
  gasolina: 'Gasolina', combustible: 'Gasolina',
  transporte: 'Transporte', taxi: 'Transporte', uber: 'Transporte',
  bus: 'Transporte', buseta: 'Transporte', pasaje: 'Transporte', metro: 'Transporte',
  arriendo: 'Arriendo', renta: 'Arriendo',
  internet: 'Servicios publicos', telefono: 'Servicios publicos',
  luz: 'Servicios publicos', agua: 'Servicios publicos',
  moto: 'Reparaciones moto',
  salario: 'Salario', sueldo: 'Salario', quincena: 'Salario', nomina: 'Salario',
  prestamo: 'Préstamos',
  credito: 'Tarjetas de crédito', tarjeta: 'Tarjetas de crédito',
  ropa: 'Ropa', zapatos: 'Ropa',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function stripPunct(token: string): string {
  return token.replace(/^[^\w]+|[^\w]+$/g, '');
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  let dist = 0;
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  dist = dp[a.length][b.length];
  return 1 - dist / maxLen;
}

function findBanco(token: string): string | null {
  const clean = normalize(stripPunct(token));
  if (!clean) return null;

  if (BANCO_MAP[clean]) return BANCO_MAP[clean];

  // Fuzzy match
  let best: string | null = null;
  let bestScore = 0.72;
  for (const key of Object.keys(BANCO_MAP)) {
    const score = similarity(clean, key);
    if (score > bestScore) { bestScore = score; best = key; }
  }
  if (best) return BANCO_MAP[best];

  // Fingerprint match
  for (const [canonical, fingerprints] of BANCO_FINGERPRINTS) {
    if (fingerprints.some(fp => clean.includes(fp))) return canonical;
  }

  return null;
}

function inferCategory(descripcion: string, tipo: string): string | null {
  const norm = normalize(descripcion);
  if ([...STREAMING_KEYWORDS].some(kw => norm.includes(kw))) {
    return tipo === 'ingreso' ? 'Venta de cuentas Netflix/Prime/Max' : 'Pago de cuentas Netflix/Prime/Max';
  }
  for (const [kw, cat] of Object.entries(CATEGORY_MAP)) {
    if (norm.includes(kw)) return cat;
  }
  return null;
}

function formatMoney(value: number): string {
  return `$${value.toLocaleString('es-CO')}`;
}

function parseMessage(text: string): Record<string, unknown> | null {
  const textNorm = normalize(text);

  const tipo = (
    [...INGRESO_KEYWORDS].some(kw => textNorm.includes(kw)) ||
    [...IMPLICIT_INGRESO_KEYWORDS].some(kw => textNorm.includes(kw))
  ) ? 'ingreso' : 'gasto';

  const processed = text.replace(/\bme\s+pagaron\b/gi, '').trim();
  let tokens = processed.split(/\s+/)
    .map(t => stripPunct(t))
    .filter(t => t.length > 0)
    .filter(t => !INGRESO_SINGLE_WORDS.has(normalize(t)))
    .filter(t => !FILLER_WORDS.has(normalize(t)));

  if (tokens.length === 0) return null;

  // Encontrar monto
  let amount: number | null = null;
  let amountIdx = -1;
  let multiplierIdx = -1;

  for (let i = 0; i < tokens.length; i++) {
    const numStr = tokens[i].replace(/[.,]/g, '');
    if (/^\d+$/.test(numStr)) {
      amount = parseInt(numStr, 10);
      amountIdx = i;
      if (i + 1 < tokens.length && MULTIPLIERS[normalize(tokens[i + 1])]) {
        amount *= MULTIPLIERS[normalize(tokens[i + 1])];
        multiplierIdx = i + 1;
      }
      break;
    }
  }

  if (amount === null) return null;

  const skip = new Set([amountIdx, ...(multiplierIdx >= 0 ? [multiplierIdx] : [])]);
  const remaining = tokens.filter((_, i) => !skip.has(i));

  if (remaining.length === 0) return null;

  // Buscar el banco en cualquier posición (no solo al final)
  let banco: string | null = null;
  let bancoIdx = -1;
  for (let i = 0; i < remaining.length; i++) {
    const found = findBanco(remaining[i]);
    if (found) { banco = found; bancoIdx = i; break; }
  }

  const descTokens = remaining.filter((_, i) => i !== bancoIdx);

  // Si no se detectó banco, usar Efectivo como fallback
  if (!banco) banco = 'Efectivo';

  const descripcion = descTokens.map((t, i) => i === 0 ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : t.toLowerCase()).join(' ');
  const now = new Date();

  return {
    tipo,
    valor: amount,
    descripcion,
    fecha: now.toISOString(),
    banco_destino: banco,
    categoria: inferCategory(descripcion, tipo),
    mes_contable: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  };
}

// ─── Telegram helpers ─────────────────────────────────────────────────────────

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function getTelegramFileBuffer(fileId: string): Promise<ArrayBuffer> {
  const res = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const data = await res.json();
  const filePath = data.result.file_path;
  const fileRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`);
  return fileRes.arrayBuffer();
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function processText(chatId: number, text: string) {
  const movimiento = parseMessage(text);

  if (!movimiento) {
    await sendMessage(chatId, '❌ No entendí el mensaje. Ejemplo: 50000 almuerzo nequi');
    return;
  }

  const { error } = await supabase.from('movimientos').insert(movimiento);
  if (error) {
    console.error('Supabase error:', error);
    await sendMessage(chatId, `❌ Error Supabase: ${error.message} | code: ${error.code}`);
    return;
  }

  const emoji = movimiento.tipo === 'ingreso' ? '📥' : '📤';
  const banco = (movimiento.banco_destino as string) || 'Sin banco';
  await sendMessage(chatId, `${emoji} ${formatMoney(movimiento.valor as number)} · ${movimiento.descripcion} · ${banco}`);
}

async function processVoice(chatId: number, fileId: string) {
  try {
    const arrayBuffer = await getTelegramFileBuffer(fileId);
    const file = new File([arrayBuffer], 'audio.ogg', { type: 'audio/ogg' });
    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3',
      language: 'es',
    });
    await processText(chatId, transcription.text.trim());
  } catch (err) {
    console.error('Groq error:', err);
    await sendMessage(chatId, '❌ No pude transcribir el audio. Intenta de nuevo.');
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId: number = message.chat.id;

    if (message.text) {
      if (message.text === '/start') {
        await sendMessage(chatId,
          '👋 Bot de gastos listo.\n\nEnvíame un mensaje de texto o nota de voz 🎤:\n\n' +
          '  50000 almuerzo nequi\n' +
          '  transporte 3200 efectivo\n' +
          '  ingreso 2500000 salario nequi\n' +
          '  20 mil gasolina efectivo'
        );
      } else {
        await processText(chatId, message.text);
      }
    } else if (message.voice) {
      await processVoice(chatId, message.voice.file_id);
    }
  } catch (err) {
    console.error('Webhook error:', err);
  }

  return NextResponse.json({ ok: true });
}
