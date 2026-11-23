import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { jsPDF } from 'jspdf';
import type { RedactionBox } from '../types';
import { applyRedactionBoxesToCanvas } from './redactionEngine';

// Configure local bundled worker (zero external CDN required)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface LoadedPdf {
  doc: pdfjsLib.PDFDocumentProxy;
  numPages: number;
}

export async function loadPdfFromFile(file: File): Promise<LoadedPdf> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const doc = await loadingTask.promise;
  return {
    doc,
    numPages: doc.numPages,
  };
}

export async function renderPdfPageToCanvas(
  doc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale = 1.6
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

/**
 * True secure PDF redaction export:
 * Renders each page to a raster canvas, permanently burns redaction boxes into pixels,
 * and compiles a fresh rasterized PDF so 0% of original underlying text/vectors remain recoverable.
 */
export async function exportRasterizedRedactedPdf(
  doc: pdfjsLib.PDFDocumentProxy,
  pageRedactions: Record<number, RedactionBox[]>,
  maxPages: number,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const totalPages = Math.min(doc.numPages, maxPages);
  let pdf: jsPDF | null = null;

  for (let p = 1; p <= totalPages; p++) {
    onProgress?.(p, totalPages);
    const canvas = await renderPdfPageToCanvas(doc, p, 1.8);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const boxes = pageRedactions[p] || [];
      applyRedactionBoxesToCanvas(ctx, canvas.width, canvas.height, boxes);
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    const orientation = canvas.width > canvas.height ? 'l' : 'p';
    const ptW = canvas.width * 0.75;
    const ptH = canvas.height * 0.75;

    if (!pdf) {
      pdf = new jsPDF({
        orientation,
        unit: 'pt',
        format: [ptW, ptH],
      });
    } else {
      pdf.addPage([ptW, ptH], orientation);
    }

    pdf.addImage(imgData, 'JPEG', 0, 0, ptW, ptH, undefined, 'FAST');

    // Immediately free canvas memory before next page
    canvas.width = 0;
    canvas.height = 0;
  }

  if (!pdf) {
    throw new Error('No pages rendered');
  }

  return pdf.output('blob');
}
