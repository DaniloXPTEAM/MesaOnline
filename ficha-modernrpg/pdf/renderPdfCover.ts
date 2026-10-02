/**
 * Renderiza a primeira página de um PDF como imagem (data URL), para uso
 * como capa real do livro na Biblioteca.
 */
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as pdfjsLib from "pdfjs-dist";

// Worker do pdf.js servido pelo próprio projeto (antes vinha do unpkg.com, o que exigia internet para importar PDF).
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function renderPdfCoverToDataUrl(file: File): Promise<string | null> {
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    // API oficial do pdfjs: o parâmetro de render é o contexto 2D do canvas.
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return null;
  }
}
