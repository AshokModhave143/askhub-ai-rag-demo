import type { ParsedDocument, ParsedPage } from '@askhub-ai-rag-demo/core-domain';
import type { IDocumentParser } from '@askhub-ai-rag-demo/core-ports';

// Lazy imports to avoid bundling in environments that don't need them
async function getPdfParse() {
  const mod = require('pdf-parse');
  return (mod.default ?? mod) as (
    buffer: Buffer,
    options?: { pagerender?: (pageData: unknown) => string },
  ) => Promise<{ text: string; numpages: number }>;
}

async function getMammoth() {
  const mod = require('mammoth');
  return mod as {
    extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }>;
  };
}

async function getXlsx() {
  const mod = require('xlsx');
  return (mod.default ?? mod) as {
    read: (data: Buffer, opts: { type: string }) => unknown;
    utils: {
      sheet_to_csv: (sheet: unknown) => string;
      book_get_sheet_names: (wb: unknown) => string[];
    };
  };
}

export class DocumentParserService implements IDocumentParser {
  async parse(buffer: Buffer, mimeType: string): Promise<ParsedDocument> {
    const type = mimeType.toLowerCase();

    if (type === 'application/pdf') {
      return this.parsePdf(buffer);
    }

    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return this.parseDocx(buffer);
    }

    if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return this.parseXlsx(buffer);
    }

    if (type === 'text/plain' || type === 'text/csv' || type.startsWith('text/')) {
      const text = buffer.toString('utf-8');
      return { text, pageCount: 1, pages: [{ pageNumber: 1, text }] };
    }

    throw new Error(`Unsupported MIME type for parsing: ${mimeType}`);
  }

  private async parsePdf(buffer: Buffer): Promise<ParsedDocument> {
    const pdfParse = await getPdfParse();
    const pages: ParsedPage[] = [];

    let currentPage = 0;
    const pdfData = await pdfParse(buffer, {
      pagerender: (pageData: unknown) => {
        currentPage++;
        const pageDataTyped = pageData as {
          getTextContent: () => Promise<{
            items: Array<{ str: string; hasEOL?: boolean }>;
          }>;
        };
        void pageDataTyped
          .getTextContent()
          .then((textContent: { items: Array<{ str: string; hasEOL?: boolean }> }) => {
            const pageText = textContent.items
              .map((item) => item.str + (item.hasEOL ? '\n' : ' '))
              .join('');
            pages.push({ pageNumber: currentPage, text: pageText.trim() });
          });
        return '';
      },
    });

    // If page-level parsing didn't capture pages, fall back to full text
    const finalPages = pages.length > 0 ? pages : [{ pageNumber: 1, text: pdfData.text }];

    return {
      text: pdfData.text,
      pageCount: pdfData.numpages,
      pages: finalPages,
    };
  }

  private async parseDocx(buffer: Buffer): Promise<ParsedDocument> {
    const mammoth = await getMammoth();
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
      pageCount: 1,
      pages: [{ pageNumber: 1, text: result.value }],
    };
  }

  private async parseXlsx(buffer: Buffer): Promise<ParsedDocument> {
    const xlsx = await getXlsx();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetNames = xlsx.utils.book_get_sheet_names(workbook);

    const pages: ParsedPage[] = [];
    const allText: string[] = [];

    const wb = workbook as Record<string, unknown>;
    const Sheets = wb['Sheets'] as Record<string, unknown>;

    for (let i = 0; i < sheetNames.length; i++) {
      const sheetName = sheetNames[i];
      const sheet = Sheets[sheetName];
      const csv = xlsx.utils.sheet_to_csv(sheet);
      const sheetText = `Sheet: ${sheetName}\n${csv}`;
      pages.push({ pageNumber: i + 1, text: sheetText });
      allText.push(sheetText);
    }

    return {
      text: allText.join('\n\n'),
      pageCount: sheetNames.length,
      pages,
    };
  }
}
