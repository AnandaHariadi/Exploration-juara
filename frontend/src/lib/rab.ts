import type { CandidateRabItem } from '@/types';
import * as XLSX from 'xlsx';

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
      if (quoted && line[i + 1] === '"') { current += '"'; i += 1; }
      else quoted = !quoted;
    } else if (ch === delimiter && !quoted) {
      cells.push(current.trim());
      current = '';
    } else current += ch;
  }
  cells.push(current.trim());
  return cells;
}

/** Returns null unless the text is a whole, safe integer amount in rupiah. */
export function parseRupiah(raw: string): number | null {
  let value = raw.replace(/rp\.?/i, '').replace(/\s/g, '');
  if (!value) return null;
  value = value.replace(/,00$/, '').replace(/\.00$/, '');
  if (!/^\d{1,3}([.,]\d{3})*$|^\d+$/.test(value)) return null;
  const amount = Number(value.replace(/[.,]/g, ''));
  return Number.isSafeInteger(amount) ? amount : null;
}

type Row = unknown[];
interface Header {
  row: number;
  category: number;
  description: number;
  amount: number;
  score: number;
}

const cellText = (cell: unknown) => String(cell ?? '').trim();
const headerText = (cell: unknown) => cellText(cell).toLowerCase()
  .replace(/\([^)]*\)/g, ' ').replace(/[_/.,-]+/g, ' ').replace(/\s+/g, ' ').trim();

function descriptionScore(value: string): number {
  if (/^(deskripsi|description|uraian|item|pekerjaan|keterangan|kegiatan|komponen biaya|uraian pekerjaan|kegiatan komponen biaya|nama kegiatan|nama pekerjaan)$/.test(value)) return 3;
  return /\b(uraian|deskripsi|kegiatan|komponen biaya|pekerjaan)\b/.test(value) ? 2 : 0;
}

function amountScore(value: string): number {
  if (/\b(harga satuan|unit price|kuantitas|qty|volume|waktu|bulan)\b/.test(value)) return 0;
  if (/^(jumlah harga|total harga|jumlah biaya|total biaya|planned cost|rencana biaya|nilai anggaran|total anggaran)$/.test(value)) return 5;
  if (/^(jumlah|amount|total|biaya|nilai|anggaran|subtotal)$/.test(value)) return 2;
  return /\b(jumlah harga|total harga|total biaya|planned cost|anggaran)\b/.test(value) ? 4 : 0;
}

function findHeader(rows: Row[]): Header | null {
  let best: Header | null = null;
  for (let row = 0; row < Math.min(rows.length, 30); row += 1) {
    const cells = rows[row].map(headerText);
    let description = -1;
    let amount = -1;
    let descScore = 0;
    let moneyScore = 0;
    for (let i = 0; i < cells.length; i += 1) {
      const d = descriptionScore(cells[i]);
      const a = amountScore(cells[i]);
      if (d > descScore) { description = i; descScore = d; }
      if (a > moneyScore) { amount = i; moneyScore = a; }
    }
    if (description < 0 || amount < 0 || description === amount) continue;
    const category = cells.findIndex((c) => /^(kategori|category|pos|kelompok)$/.test(c));
    const candidate = { row, category, description, amount, score: descScore + moneyScore };
    if (!best || candidate.score > best.score) best = candidate;
  }
  return best;
}

function amountOf(value: unknown): number | null {
  if (typeof value === 'number') return Number.isSafeInteger(value) ? value : null;
  return parseRupiah(cellText(value));
}

function parseRows(rows: Row[], header: Header): ParsedRab {
  const items: CandidateRabItem[] = [];
  const warnings: string[] = [];
  let statedTotal: number | null = null;
  let currentCategory = '';
  for (let r = header.row + 1; r < rows.length; r += 1) {
    const cells = rows[r];
    const description = cellText(cells[header.description]);
    const first = cellText(cells[0]);
    const explicitCategory = header.category >= 0 ? cellText(cells[header.category]) : '';
    const rawAmount = cells[header.amount];
    const amount = amountOf(rawAmount);
    if ([first, description, explicitCategory].some((value) =>
      /^(grand\s*total|total\s*(rab|rencana|anggaran|biaya|harga|keseluruhan)?\b|jumlah\s*keseluruhan)/i.test(value))) {
      statedTotal = amount;
      break;
    }
    if ([first, description, explicitCategory].some((value) =>
      /^(sub\s*total|jumlah\s*biaya\s*(langsung|personil|non))/i.test(value))) continue;
    if (!description) {
      if (first && amount === null && /^(?:[IVXLC]+\.?\s+biaya|biaya langsung)\b/i.test(first)) {
        currentCategory = first.replace(/^[IVXLC]+\.?\s+/i, '').trim();
      }
      continue;
    }
    if (amount === null || amount <= 0) {
      if (/^(?:[IVXLC]+\.?\s+biaya|biaya langsung)\b/i.test(description) && !cellText(rawAmount)) {
        currentCategory = description.replace(/^[IVXLC]+\.?\s+/i, '').trim();
        continue;
      }
      warnings.push(`Baris ${r + 1} (${description}): jumlah "${cellText(rawAmount)}" tidak dapat dibaca, dilewati.`);
      continue;
    }
    items.push({
      id: `RAB-${items.length + 1}`,
      category: explicitCategory || currentCategory || 'Lainnya',
      description,
      plannedAmount: amount,
    });
  }
  if (items.length === 0) throw new Error('Tidak ada baris RAB yang valid.');
  const total = items.reduce((sum, item) => sum + item.plannedAmount, 0);
  if (!Number.isSafeInteger(total)) throw new Error('Jumlah RAB melebihi batas angka yang dapat dihitung dengan aman.');
  if (statedTotal !== null && statedTotal !== total) {
    warnings.push(`Baris TOTAL di berkas (${statedTotal.toLocaleString('id-ID')}) berbeda dengan jumlah item (${total.toLocaleString('id-ID')}). Rencana biaya memakai jumlah item.`);
  }
  return { items, total, warnings };
}

const HEADER_ERROR = 'Kolom RAB tidak dikenali. Gunakan kolom uraian/kegiatan dan jumlah biaya.';

export function parseRabCsv(content: string): ParsedRab {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error('Berkas RAB kosong atau hanya berisi judul kolom.');
  const layouts = [',', ';'].map((delimiter) => {
    const rows = lines.map((line) => splitCsvLine(line, delimiter));
    return { rows, header: findHeader(rows) };
  });
  const layout = layouts.filter((option) => option.header)
    .sort((a, b) => (b.header?.score ?? 0) - (a.header?.score ?? 0))[0];
  if (!layout?.header) throw new Error(HEADER_ERROR);
  return parseRows(layout.rows, layout.header);
}

/** Parse the first sheet with recognizable RAB columns, including title rows and grouped sections. */
export function parseRabExcel(buffer: Buffer): ParsedRab {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  if (workbook.SheetNames.length === 0) throw new Error('Berkas Excel tidak memiliki lembar kerja (sheet).');
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, blankrows: true, defval: '' });
    const header = findHeader(rows);
    if (header) return parseRows(rows, header);
  }
  throw new Error(HEADER_ERROR);
}

/** Dispatch Excel and CSV through the same row validation rules. */
export function parseRabBuffer(buffer: Buffer, fileName = ''): ParsedRab {
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  return ext === 'xlsx' || ext === 'xls' ? parseRabExcel(buffer) : parseRabCsv(buffer.toString('utf8'));
}
