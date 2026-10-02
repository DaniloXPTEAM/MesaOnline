import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import type { ModernRpgE2EBridge } from "../../src/testing/e2eBridge";

/**
 * MULTIJOGADOR REAL, DUAS PONTAS — o que os lotes 4/8/11 acrescentaram e a
 * suite existente nao cobria: fog por papel, visibilidade da ENTIDADE e
 * sussurro. Mestre e Jogador em contextos de navegador separados.
 */
const peerOptions = { host: "127.0.0.1", port: 9000, path: "/peerjs", secure: false, debug: 0, config: { iceServers: [] } };
type E2EWindow = Window & { __MODERNRPG_E2E__: ModernRpgE2EBridge };

async function createContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext();
  await context.addInitScript((options) => {
    try {
      if (!sessionStorage.getItem("__modernrpg_e2e_ready__")) {
        localStorage.clear();
        sessionStorage.setItem("__modernrpg_e2e_ready__", "1");
      }
    } catch { /* about:blank */ }
    (window as Window & { __MODERNRPG_PEER_OPTIONS__?: typeof options }).__MODERNRPG_PEER_OPTIONS__ = options;
  }, peerOptions);
  return context;
}

async function openMesa(page: Page) {
  await page.goto("/mesa/");
  await page.waitForFunction(() => Boolean((window as Window & { __MODERNRPG_E2E__?: ModernRpgE2EBridge }).__MODERNRPG_E2E__));
}
const snapshot = (page: Page) => page.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.snapshot());

const base = {
  accent: "#c99a45", hp: 30, hpMax: 40, pm: 15, pmMax: 20, defense: 18,
  initiative: 5, initiativeRoll: 0, luta: 6, pontaria: 8, damage: "1d6",
  crit: 20, critMultiplier: 2 as const, attackType: "ranged" as const, rangeM: 9,
  movementM: 9, level: 7, spellDC: 20, actionIds: [], tacticalActions: [],
  fortitude: 6, reflexes: 8, will: 10, conditions: [],
};

test("Fog por papel, visibilidade da entidade e sussurro em duas pontas", async ({ browser }) => {
  const masterCtx = await createContext(browser);
  const playerCtx = await createContext(browser);
  const master = await masterCtx.newPage();
  const player = await playerCtx.newPage();
  await openMesa(master);
  await openMesa(player);

  // --- sala real ---
  await master.getByRole("button", { name: /Criar sala online/ }).click();
  await expect.poll(async () => (await snapshot(master)).multiplayer.status).toBe("connected");
  const code = (await snapshot(master)).multiplayer.roomCode;

  await player.getByPlaceholder("CÓDIGO").fill(code);
  await player.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect.poll(async () => (await snapshot(player)).multiplayer.status).toBe("connected");
  const playerPeer = (await snapshot(player)).multiplayer.peerId;
  expect(playerPeer).not.toBe("");

  // --- cena: heroi do jogador perto, ameaca longe ---
  await master.evaluate(([b, peer]) => {
    const api = (window as E2EWindow).__MODERNRPG_E2E__;
    api.addToken({ ...b, id: "v-hero", name: "Vigia", title: "Heroi", side: "heroes",
      gx: 2, gy: 2, symbol: "VG", controlledBy: peer } as never);
    api.addToken({ ...b, id: "v-longe", name: "Espreitador", title: "ND 2", side: "threats",
      gx: 12, gy: 12, symbol: "ES", accent: "#8f2b3d" } as never);
  }, [base, playerPeer] as never);

  await expect.poll(async () => (await snapshot(player)).board.tokens.length).toBeGreaterThanOrEqual(2);

  // --- escuridao total: a cadeia luz -> visao -> fog entra em acao ---
  await master.evaluate(() => {
    const api = (window as E2EWindow).__MODERNRPG_E2E__;
    api.setLighting("darknight");
    api.setFogSettings({ playerFogEnabled: true, darknessRevealedOnlyByLights: true });
  });

  // O JOGADOR nao enxerga a ameaca distante: a ENTIDADE inteira some do mapa dele.
  await expect.poll(async () =>
    player.locator("[data-token-id]").filter({ hasText: "Espreitador" }).count(),
  ).toBe(0);
  // ...mas continua vendo o proprio heroi.
  await expect(player.locator("[data-token-id]").filter({ hasText: "Vigia" })).toHaveCount(1);
  // O MESTRE mantem visao administrativa.
  await expect(master.locator("[data-token-id]").filter({ hasText: "Espreitador" })).toHaveCount(1);

  // Nome e barra de PV somem junto — nao basta esconder a imagem.
  const restos = await player.evaluate(() =>
    [...document.querySelectorAll("[data-token-id] small")].map((n) => n.textContent || ""));
  expect(restos.join(" ")).not.toContain("Espreitador");

  // --- acender uma luz perto da ameaca revela a entidade para o jogador ---
  await master.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.upsertLight({
    id: "v-tocha", x: 12, y: 12, type: "torch", name: "Tocha", radius: 6,
    color: "#ffb765", intensity: 1, enabled: true,
  } as never));
  await expect.poll(async () =>
    player.locator("[data-token-id]").filter({ hasText: "Espreitador" }).count(),
  ).toBe(1);

  // --- sussurro: so o destinatario ve ---
  await master.evaluate((peer) => (window as E2EWindow).__MODERNRPG_E2E__.appendChat({
    author: "Mestre", text: "segredo-para-o-jogador", kind: "chat",
    whisperTo: peer, whisperFrom: "mestre",
  } as never), playerPeer);

  await expect.poll(async () =>
    (await snapshot(player)).board.chat.some((m) => m.text === "segredo-para-o-jogador"),
  ).toBe(true);

  await player.getByRole("button", { name: "Diário e histórico" }).click();
  const diario = player.locator(".mesa-left-drawer");
  await expect(diario.getByText("segredo-para-o-jogador")).toBeVisible();
  // o autor aparece marcado como sussurro, nao como mensagem publica
  await expect(diario.getByText(/\(sussurro\)/i).first()).toBeVisible();

  // Nao fechamos os contextos manualmente: este Chromium roda em single-process
  // e `context.close()` derruba o browser inteiro. O Playwright limpa no fim.
});
