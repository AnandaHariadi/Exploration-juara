// Generate the demo contract PDF from data/samples/kontrak-demo.json.
// Run: node scripts/generate-sample-contract.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const spec = JSON.parse(fs.readFileSync(path.join(root, 'data/samples/kontrak-demo.json'), 'utf8'));

const pdf = await PDFDocument.create();
pdf.setTitle(spec.title);
pdf.setSubject('Dokumen contoh untuk demo CLARA');
const font = await pdf.embedFont(StandardFonts.Helvetica);
const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
const size = 11;
const margin = 60;

function wrap(text, width, f) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (f.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  lines.push(line);
  return lines;
}

spec.pages.forEach((lines, index) => {
  const page = pdf.addPage([595, 842]);
  let y = 842 - margin;
  for (const raw of lines) {
    const isHeading = /^(Pasal \d+|PERJANJIAN|Nomor:)/.test(raw);
    const f = isHeading ? bold : font;
    for (const line of raw ? wrap(raw, 595 - margin * 2, f) : ['']) {
      page.drawText(line, { x: margin, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
      y -= size * 1.6;
    }
  }
  page.drawText(`Halaman ${index + 1} dari ${spec.pages.length}`, { x: margin, y: 30, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
});

const out = path.join(root, 'data/samples', spec.fileName);
fs.writeFileSync(out, await pdf.save());
console.log(`Wrote ${out}`);
