// Deterministic RAB (budget plan) parser for CSV. No AI involved: numbers in a
// RAB are read exactly as written, and unreadable rows are reported, not guessed.

import type { CandidateRabItem } from '@/types';

export interface ParsedRab {
  items: CandidateRabItem[];
  total: number;
  warnings: string[];
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (ch === delimiter && !quoted) {
      cells.push(current.trim());
      current = '';
    } else current += ch;
  }
  cells.push(current.trim());
  return cells;
}

/** "Rp 45.000.000", "45000000", "45.000.000,00" → 45000000. Returns null when not a whole rupiah amount. */
export function parseRupiah(raw: string): number | null {
  let text = raw.replace(/rp\.?/i, '').replace(/\s/g, '');
  if (!text) return null;
  text = text.replace(/,00$/, '').replace(/\.00$/, '');
  if (!/^\d{1,3}([.,]\d{3})*$|^\d+$/.test(text)) return null;
  const value = Number(text.replace(/[.,]/g, ''));
  return Number.isSafeInteger(value) ? value : null;
}

const CATEGORY = /^(kategori|category|pos|kelompok)$/i;
const DESCRIPTION = /^(deskripsi|description|uraian|item|pekerjaan|keterangan)$/i;
const AMOUNT = /^(jumlah|amount|total|biaya|nilai|planned_cost|planned cost|anggaran|subtotal)$/i;

export function parseRabCsv(content: string): ParsedRab {
  const text = content.replace(/^﻿/, '');
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error('Berkas RAB kosong atau hanya berisi judul kolom.');

  const delimiter = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const header = splitCsvLine(lines[0], delimiter).map((h) => h.toLowerCase());
  const catIdx = header.findIndex((h) => CATEGORY.test(h));
  const descIdx = header.findIndex((h) => DESCRIPTION.test(h));
  const amountIdx = header.findIndex((h) => AMOUNT.test(h));
  if (amountIdx < 0 || descIdx < 0) {
    throw new Error('Kolom RAB tidak dikenali. Gunakan judul kolom: kategori, deskripsi, jumlah.');
  }

  const items: CandidateRabItem[] = [];
  const warnings: string[] = [];
  let statedTotal: number | null = null as number | null;

  for (const [index, line] of lines.slice(1).entries()) {
    const cells = splitCsvLine(line, delimiter);
    const description = cells[descIdx] ?? '';
    const category = catIdx >= 0 ? cells[catIdx] ?? '' : '';
    const amount = parseRupiah(cells[amountIdx] ?? '');
    const rowNumber = index + 2;
    if (/^(grand\s*)?total$/i.test(description.trim()) || /^(grand\s*)?total$/i.test(category.trim())) {
      statedTotal = amount;
      continue;
    }
    if (!description) {
      warnings.push(`Baris ${rowNumber}: deskripsi kosong, dilewati.`);
      continue;
    }
    if (amount === null || amount <= 0) {
      warnings.push(`Baris ${rowNumber} (${description}): jumlah "${cells[amountIdx] ?? ''}" tidak dapat dibaca, dilewati.`);
      continue;
    }
    items.push({ id: `RAB-${items.length + 1}`, category: category || 'Lainnya', description, plannedAmount: amount });
  }

  if (items.length === 0) throw new Error('Tidak ada baris RAB yang valid.');
  const total = items.reduce((sum, item) => sum + item.plannedAmount, 0);
  if (statedTotal !== null && statedTotal !== total) {
    warnings.push(`Baris TOTAL di berkas (${statedTotal.toLocaleString('id-ID')}) berbeda dengan jumlah item (${total.toLocaleString('id-ID')}). Rencana biaya memakai jumlah item.`);
  }
  return { items, total, warnings };
}
