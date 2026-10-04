import { NextRequest, NextResponse } from 'next/server';
import { DEMO_PERSONA_COOKIE, withDemoPersona } from './demoPersona';

/** Business/validation failure with an HTTP status and a stable code. */
export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string, code = 'VALIDATION_ERROR') => new HttpError(400, code, message);
export const notFound = (message: string, code = 'NOT_FOUND') => new HttpError(404, code, message);
export const conflict = (message: string, code = 'CONFLICT') => new HttpError(409, code, message);

export function ok<T>(data: T, status = 200, message?: string) {
  return NextResponse.json({ success: true, data, ...(message ? { message } : {}) }, { status });
}

export function fail(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;

/**
 * Wrap a route handler: HttpErrors become their status, anything else is
 * logged server-side and returned as a generic 500 without stack or secrets.
 */
export function route<C>(name: string, handler: Handler<C>): Handler<C> {
  return async (req, ctx) => withDemoPersona(req.cookies.get(DEMO_PERSONA_COOKIE)?.value, async () => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof HttpError) return fail(error.status, error.code, error.message);
      console.error(`[API] ${name} failed:`, error instanceof Error ? error.message : error);
      return fail(500, 'INTERNAL_ERROR', 'Terjadi kesalahan di server. Coba lagi.');
    }
  });
}

/** Parse a JSON body; malformed or non-object bodies are a 400. Empty body → {}. */
export async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (!text.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw badRequest('Body permintaan bukan JSON yang valid.', 'MALFORMED_JSON');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw badRequest('Body permintaan harus berupa objek JSON.', 'MALFORMED_JSON');
  return parsed as Record<string, unknown>;
}

const ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;

export function assertId(value: string, label = 'ID'): string {
  if (!ID_PATTERN.test(value)) throw badRequest(`${label} tidak valid.`, 'INVALID_ID');
  return value;
}

export function str(body: Record<string, unknown>, key: string, opts: { required?: boolean; max?: number; label?: string } = {}): string {
  const raw = body[key];
  const label = opts.label ?? key;
  if (raw === undefined || raw === null || (typeof raw === 'string' && !raw.trim())) {
    if (opts.required) throw badRequest(`${label} wajib diisi.`);
    return '';
  }
  if (typeof raw !== 'string') throw badRequest(`${label} harus berupa teks.`);
  const value = raw.trim();
  if (opts.max && value.length > opts.max) throw badRequest(`${label} maksimal ${opts.max} karakter.`);
  return value;
}

/** Integer rupiah / count. Rejects NaN, fractions, strings with letters, and out-of-range values. */
export function int(body: Record<string, unknown>, key: string, opts: { required?: boolean; min?: number; max?: number; label?: string; fallback?: number } = {}): number {
  const raw = body[key];
  const label = opts.label ?? key;
  if (raw === undefined || raw === null || raw === '') {
    if (opts.required) throw badRequest(`${label} wajib diisi.`);
    return opts.fallback ?? 0;
  }
  const value = typeof raw === 'number' ? raw : typeof raw === 'string' && /^-?\d+$/.test(raw.trim()) ? Number(raw.trim()) : NaN;
  if (!Number.isFinite(value) || !Number.isInteger(value)) throw badRequest(`${label} harus berupa bilangan bulat.`, 'INVALID_NUMBER');
  if (opts.min !== undefined && value < opts.min) throw badRequest(`${label} minimal ${opts.min.toLocaleString('id-ID')}.`, 'INVALID_NUMBER');
  if (opts.max !== undefined && value > opts.max) throw badRequest(`${label} maksimal ${opts.max.toLocaleString('id-ID')}.`, 'INVALID_NUMBER');
  return value;
}

export function oneOf<T extends string>(body: Record<string, unknown>, key: string, allowed: readonly T[], fallback?: T): T {
  const raw = body[key];
  if ((raw === undefined || raw === null || raw === '') && fallback !== undefined) return fallback;
  if (typeof raw !== 'string' || !allowed.includes(raw as T)) throw badRequest(`${key} harus salah satu dari: ${allowed.join(', ')}.`);
  return raw as T;
}

export const MAX_RUPIAH = 1_000_000_000_000; // Rp1 triliun, guard against typos/overflow.
