/**
 * Importador de ficha em PDF → dados da ficha digital.
 *
 *  1. Lê os campos de formulário (AcroForm) do PDF, quando existirem
 *     (ficha oficial editável / fichas exportadas por outros apps).
 *  2. Extrai o texto de todas as páginas (agrupado por linha).
 *  3. Aplica as heurísticas de `parseSheetText` e devolve um rascunho
 *     para o usuário revisar antes de aplicar.
 */
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as pdfjsLib from "pdfjs-dist";
import { findClassByName, findRaceByName } from "../t20/compendium";
import { parseFormFields, parseText, type PdfDraft } from "./parseSheetText";

export type { PdfDraft } from "./parseSheetText";

// Worker do pdf.js servido pelo próprio projeto (antes vinha do unpkg.com, o que exigia internet para importar PDF).
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/* ------------------------------ Leitura do PDF ------------------------------ */

export async function readPdf(file: File): Promise<{ text: string; fields: Record<string, string> }> {
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const fields: Record<string, string> = {};
  const lines: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);

    // Campos de formulário
    const annots = (await page.getAnnotations()) as Array<Record<string, unknown>>;
    for (const a of annots) {
      if (a.subtype !== "Widget") continue;
      const name = String(a.fieldName ?? "");
      const value = a.fieldValue ?? a.buttonValue;
      if (!name) continue;
      if (a.checkBox) {
        fields[name] = a.fieldValue && a.fieldValue !== "Off" ? "on" : "";
      } else if (value !== undefined && value !== null && String(value).trim()) {
        fields[name] = String(value).trim();
      }
    }

    // Texto — agrupa por linha usando a coordenada Y
    const content = await page.getTextContent();
    const rows = new Map<number, { x: number; str: string }[]>();
    for (const it of content.items as Array<{ str: string; transform: number[] }>) {
      if (!it.str?.trim()) continue;
      const y = Math.round(it.transform[5] / 3) * 3;
      const x = it.transform[4];
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)!.push({ x, str: it.str });
    }
    const ordered = [...rows.entries()].sort((a, b) => b[0] - a[0]);
    for (const [, cells] of ordered) {
      lines.push(cells.sort((a, b) => a.x - b.x).map((c) => c.str).join(" "));
    }
    lines.push("");
  }
  return { text: lines.join("\n"), fields };
}

/* --------------------------------- Pipeline --------------------------------- */

export async function importSheetPdf(file: File): Promise<PdfDraft> {
  const draft: PdfDraft = { attributes: {}, skills: {}, trainedSkills: [], rawText: "", formFields: {}, warnings: [] };
  const { text, fields } = await readPdf(file);
  draft.rawText = text;
  draft.formFields = fields;

  if (Object.keys(fields).length) parseFormFields(fields, draft);
  parseText(text, draft);

  if (draft.race) draft.raceId = findRaceByName(draft.race)?.id;
  if (draft.class) {
    const m = draft.class.match(/(.+?)\s*(\d{1,2})\s*$/);
    if (m && draft.level === undefined) {
      draft.level = Number(m[2]);
      draft.class = m[1].trim();
    }
    draft.classId = findClassByName(draft.class)?.id;
  }
  draft.trainedSkills = [...new Set(draft.trainedSkills)];

  if (!Object.keys(fields).length && !text.replace(/\s/g, "").length) {
    draft.warnings.push("O PDF não contém texto pesquisável (provavelmente é uma imagem escaneada). Preencha os campos manualmente.");
  }
  if (!draft.name) draft.warnings.push("Nome não identificado.");
  if (!draft.raceId) draft.warnings.push(`Raça não reconhecida${draft.race ? ` ("${draft.race}")` : ""}.`);
  if (!draft.classId) draft.warnings.push(`Classe não reconhecida${draft.class ? ` ("${draft.class}")` : ""}.`);
  if (!Object.keys(draft.attributes).length) draft.warnings.push("Atributos não encontrados no texto.");
  return draft;
}
