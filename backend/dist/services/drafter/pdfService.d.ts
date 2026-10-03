/**
 * pdfService.ts
 * Converts a markdown-style draft document into a PDF buffer (base64-encoded).
 *
 * Implemented against the PDF 1.4 specification using only Node.js built-ins —
 * no external npm dependencies required.
 *
 * Produces a single-or-multi-page A4 document with:
 *   - Title block (bold, centred)
 *   - Section headers (bold)
 *   - Body text (regular, line-wrapped at 90 chars)
 *   - Signature lines
 *   - Page numbers
 *
 * Limitations of this zero-dep approach:
 *   - Only the 14 standard PDF core fonts are available (no Unicode beyond Latin-1).
 *     Indonesian text (Latin characters + diacritics ä ö ü) renders correctly;
 *     CJK or Arabic characters will not.
 *   - No image embedding.
 */
interface PdfLine {
    text: string;
    bold?: boolean;
    centered?: boolean;
    heading?: boolean;
    italic?: boolean;
    skip?: boolean;
    separator?: boolean;
}
export declare function parseMarkdownToLines(markdown: string): PdfLine[];
/**
 * Build a minimal but fully compliant PDF 1.4 document.
 *
 * Each page holds a fixed number of text lines (see PAGE_HEIGHT_LINES).
 * The function applies automatic word-wrapping so long lines never overflow.
 */
export declare function buildPdf(pdfLines: PdfLine[]): Buffer;
/**
 * Convert a markdown-formatted draft document into a base64-encoded PDF string.
 *
 * @param markdownDraft  Full markdown document produced by assembleDraft()
 * @returns base64 string of the PDF file
 */
export declare function generateDraftPdf(markdownDraft: string): string;
export {};
//# sourceMappingURL=pdfService.d.ts.map