/**
 * Faixas preparadas do Jukebox: 5 linhas, cada uma com o nome do evento
 * ("Combate", "Taverna"…) e o link (YouTube ou áudio). O Mestre prepara a
 * aventura antes e, na hora, só aperta play. Ficam salvas neste navegador.
 */
import { loadAudio } from "./audioStore";
import { registerSharedAudio } from "./sharedAudio";

export const PRESET_COUNT = 5;

/** `file` = nome do áudio escolhido no computador (o arquivo fica no navegador, ver audioStore). */
export interface JukeboxPreset { name: string; url: string; file: string }

/** Chave do arquivo da linha no armazenamento de áudio. */
export const presetAudioKey = (index: number) => `jukebox-preset-${index}`;

const STORAGE = "armada-jukebox-presets-v1";

const empty = (): JukeboxPreset[] => Array.from({ length: PRESET_COUNT }, () => ({ name: "", url: "", file: "" }));

export function loadPresets(): JukeboxPreset[] {
  const presets = empty();
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE) || "[]");
    if (Array.isArray(value)) {
      value.slice(0, PRESET_COUNT).forEach((entry, index) => {
        if (entry && typeof entry === "object") {
          presets[index] = { name: String(entry.name ?? "").slice(0, 60), url: String(entry.url ?? "").slice(0, 2048), file: String(entry.file ?? "").slice(0, 120) };
        }
      });
    }
  } catch { /* lista ilegível: linhas vazias */ }
  return presets;
}

/** Atualiza uma linha (0 a 4) e devolve a lista inteira já salva. */
export function updatePreset(index: number, patch: Partial<JukeboxPreset>): JukeboxPreset[] {
  const presets = loadPresets();
  if (!Number.isInteger(index) || index < 0 || index >= PRESET_COUNT) return presets;
  presets[index] = {
    name: (patch.name ?? presets[index].name).slice(0, 60),
    url: (patch.url ?? presets[index].url).slice(0, 2048),
    file: (patch.file ?? presets[index].file).slice(0, 120),
  };
  try { localStorage.setItem(STORAGE, JSON.stringify(presets)); } catch { /* armazenamento cheio */ }
  return presets;
}

// Endereço temporário (blob:) do arquivo de cada linha, criado uma vez por sessão.
const objectUrls = new Map<number, string>();

/** Endereço em uso do arquivo da linha, se já foi aberto nesta sessão. */
export function cachedPresetUrl(index: number): string | undefined { return objectUrls.get(index); }

/** Abre o arquivo guardado da linha (ou devolve o já aberto). Null se não existe mais. */
export async function presetFileUrl(index: number, presetKey: string): Promise<string | null> {
  const cached = objectUrls.get(index);
  if (cached) return cached;
  const blob = await loadAudio(presetKey);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  objectUrls.set(index, url);
  registerSharedAudio(url, blob, presetKey);
  return url;
}

/** Descarta o endereço aberto da linha (trocou ou removeu o arquivo). */
export function forgetPresetUrl(index: number): void {
  const url = objectUrls.get(index);
  if (url) { try { URL.revokeObjectURL(url); } catch { /* já revogado */ } }
  objectUrls.delete(index);
}
