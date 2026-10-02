import JSZip from "jszip";
import { CHARACTERS_STORAGE_KEY, loadCharacterSheets } from "../../ficha-modernrpg/characterRoute";
import { getBoard, getCombatState, getRuntimeSnapshot, getScenes } from "./vttBridge";

export interface ArmadaExportPackage {
  format: "ModernRPG-Armada";
  version: 2;
  exportedAt: string;
  SCENES: ReturnType<typeof getScenes>;
  BOARD: ReturnType<typeof getBoard>;
  TOKENS: ReturnType<typeof getBoard>["tokens"];
  combatState: ReturnType<typeof getCombatState>;
  campaign: unknown;
  characters: ReturnType<typeof loadCharacterSheets>;
}

export function buildExportPackage(): ArmadaExportPackage {
  let campaign: unknown = [];
  try { campaign = JSON.parse(localStorage.getItem("tormenta20_online_campaigns_v1") || "[]"); } catch { /* vazio */ }
  return {
    format: "ModernRPG-Armada",
    version: 2,
    exportedAt: new Date().toISOString(),
    SCENES: getScenes(),
    BOARD: getBoard(),
    TOKENS: getBoard().tokens,
    combatState: getCombatState(),
    campaign,
    characters: loadCharacterSheets(),
  };
}

export function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadGamePackage(
  _legacy?: unknown,
  onStatus: (status: string) => void = () => undefined,
): Promise<void> {
  onStatus("Preparando mesa unificada…");
  const payload = buildExportPackage();
  const zip = new JSZip();
  zip.file("modernrpg-armada.json", JSON.stringify(payload, null, 2));
  zip.file("BOARD.json", JSON.stringify(payload.BOARD, null, 2));
  zip.file("SCENES.json", JSON.stringify(payload.SCENES, null, 2));
  zip.file("combatState.json", JSON.stringify(payload.combatState, null, 2));
  zip.file("characters.json", JSON.stringify({ storageKey: CHARACTERS_STORAGE_KEY, characters: payload.characters }, null, 2));
  zip.file("README.txt", "ModernRPG Armada\nBOARD.tokens é o elenco único. CharacterSheet.id é o vínculo oficial.\n");
  onStatus("Compactando backup…");
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `modernrpg-armada-${new Date().toISOString().slice(0, 10)}.zip`;
  link.click();
  URL.revokeObjectURL(url);
  onStatus("Backup concluído");
  void getRuntimeSnapshot();
}
