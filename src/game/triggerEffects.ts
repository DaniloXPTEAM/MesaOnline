import { rollFormula } from "./macros";
import { loadTrack, playTrack } from "./jukebox";
import type { TriggerEffect } from "./triggers";
import { appendChat, appendRoll, sendSignal } from "./vttBridge";

/**
 * Executa o efeito de um gatilho de cena. Roda no Mestre: a faixa entra no Jukebox (que já sincroniza com
 * os jogadores), o efeito sonoro vai pelo sinal de som para todos, a mensagem vai ao chat e a macro é
 * rolada no histórico de rolagens.
 */
export function runTriggerEffect(effect: TriggerEffect, who: string, place = "Gatilho"): void {
  if (effect.kind === "track") {
    loadTrack(effect.url, effect.title || undefined);
    void playTrack();
    appendChat({ author: place, text: `Toca "${effect.title || "faixa"}".`, kind: "system" });
    return;
  }
  if (effect.kind === "sfx") {
    sendSignal({ kind: "sfx", url: effect.url });
    return;
  }
  if (effect.kind === "message") {
    appendChat({ author: place, text: effect.text, kind: "system" });
    return;
  }
  const rolled = rollFormula(effect.formula);
  if (!rolled) return;
  appendRoll({
    id: `gatilho-${crypto.randomUUID()}`, actor: who, target: place, action: effect.name, kind: "system",
    natural: rolled.rolls[0], modifier: rolled.modifier, total: rolled.total, formula: effect.formula, rolls: rolled.rolls,
    outcome: `[${rolled.rolls.join(", ")}]`, success: true, timestamp: Date.now(),
  });
}
