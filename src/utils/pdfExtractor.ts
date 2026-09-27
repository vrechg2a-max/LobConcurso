import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined') {
  try {
    if (pdfjsWorker) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    } else {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
    }
  } catch (e) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
    } catch (_) {
      console.warn('PDF.js worker initialization fallback failed.');
    }
  }
}

/**
 * Checks if a string contains raw PDF binary internal syntax rather than readable legal text.
 * Prevents raw PDF objects or stream dumps (e.g. endstream, endobj, FlateDecode) from ever
 * being processed as text or displayed in the UI.
 */
export function isCorruptPdfSyntax(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const sample = text.slice(0, 3000);
  if (
    /endstream/i.test(sample) ||
    /endobj/i.test(sample) ||
    /\b\d+\s+0\s+obj\b/i.test(sample) ||
    /<<[\s\S]*?\/Filter/i.test(sample) ||
    /\/FlateDecode/i.test(sample) ||
    /xref\s*[\r\n]+\d+\s+\d+/i.test(sample) ||
    /trailer\s*<<\s*\/Size/i.test(sample) ||
    /^%PDF-\d\.\d/i.test(sample)
  ) {
    return true;
  }
  return false;
}

/**
 * Accurately determines if a file is a PDF by inspecting its name, MIME type,
 * and first bytes (%PDF- header).
 */
export async function isPdfFile(file: File | Blob): Promise<boolean> {
  if (!file) return false;
  if (file instanceof File) {
    if (/\.pdf$/i.test(file.name.trim()) || (file.type && file.type.toLowerCase().includes('pdf'))) {
      return true;
    }
  }
  try {
    const slice = file.slice(0, 8);
    const header = await slice.text();
    return header.startsWith('%PDF-');
  } catch (_) {
    return false;
  }
}

export interface PdfExtractionResult {
  text: string;
  numPages: number;
  title?: string;
  pageTexts: string[];
}

/**
 * Extracts complete, clean legal/pedagogical text from a PDF in the browser using Mozilla PDF.js.
 * Strictly guarantees that all pages are processed sequentially without truncating early.
 */
export async function extractPdfMetadataAndText(file: File | Blob): Promise<PdfExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const pageTexts: string[] = [];
    let detectedTitle = '';

    try {
      const meta = await pdfDoc.getMetadata();
      const info = (meta?.info as any) || {};
      if (info.Title && typeof info.Title === 'string' && !info.Title.toLowerCase().includes('untitled')) {
        detectedTitle = info.Title.trim();
      }
    } catch (_) {}

    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        
        let lastY: number | null = null;
        let pageStr = '';

        for (const item of textContent.items as any[]) {
          const str = item.str || '';
          if (!str) continue;

          const currentY = item.transform ? item.transform[5] : null;
          if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
            pageStr += '\n' + str;
          } else {
            pageStr += (pageStr.length > 0 && !pageStr.endsWith(' ') ? ' ' : '') + str;
          }
          lastY = currentY;
        }

        const trimmedPage = pageStr.trim();
        if (trimmedPage) {
          pageTexts.push(`--- [PÁGINA ${i} de ${numPages}] ---\n${trimmedPage}`);
        }
      } catch (pageErr) {
        console.warn(`Error reading page ${i}:`, pageErr);
      }
    }

    const fullText = pageTexts.join('\n\n').trim();

    if (fullText && fullText.length > 15 && !isCorruptPdfSyntax(fullText)) {
      return {
        text: fullText,
        numPages,
        title: detectedTitle,
        pageTexts,
      };
    }
  } catch (err) {
    console.warn('Browser PDF.js extraction note:', err);
  }

  return { text: '', numPages: 0, pageTexts: [] };
}

/**
 * Extracts clean, human-readable legal text from a PDF in the browser using Mozilla PDF.js.
 * Backward compatible wrapper for extractPdfMetadataAndText.
 */
export async function extractTextFromPdfInBrowser(file: File | Blob): Promise<string> {
  const res = await extractPdfMetadataAndText(file);
  return res.text;
}
