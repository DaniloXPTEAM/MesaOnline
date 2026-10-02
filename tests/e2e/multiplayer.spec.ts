import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import type { ModernRpgE2EBridge } from "../../src/testing/e2eBridge";

const peerOptions = { host: "127.0.0.1", port: 9000, path: "/peerjs", secure: false, debug: 0, config: { iceServers: [] } };

type E2EWindow = Window & { __MODERNRPG_E2E__: ModernRpgE2EBridge };

const IDENTITY_KEY = "modernrpg_armada_peer_identity_v1";

async function createContext(browser: Browser, { clearStorage = true } = {}): Promise<BrowserContext> {
  const context = await browser.newContext();
  await context.addInitScript(({ options, clearStorage: clear }) => {
    try {
      // Limpa apenas na primeira carga deste contexto. Um reload precisa
      // preservar a identidade PeerJS persistida — é exatamente o que o teste
      // de reconexão valida. `clearStorage: false` simula uma SEGUNDA ABA do
      // mesmo navegador, que herda a identidade já gravada.
      if (clear && !sessionStorage.getItem("__modernrpg_e2e_ready__")) {
        localStorage.clear();
        sessionStorage.setItem("__modernrpg_e2e_ready__", "1");
      }
    } catch { /* about:blank não expõe storage */ }
    (window as Window & { __MODERNRPG_PEER_OPTIONS__?: typeof options }).__MODERNRPG_PEER_OPTIONS__ = options;
  }, { options: peerOptions, clearStorage });
  return context;
}

/** Segunda aba do MESMO navegador: mesma identidade e mesma sessão salvas. */
async function openSecondTab(browser: Browser, identity: string): Promise<Page> {
  const context = await createContext(browser, { clearStorage: false });
  await context.addInitScript(([key, value]) => {
    try { localStorage.setItem(key, value); } catch { /* about:blank não expõe storage */ }
  }, [IDENTITY_KEY, identity]);
  return context.newPage();
}

async function storedIdentity(page: Page): Promise<string> {
  return page.evaluate((key) => localStorage.getItem(key) || "", IDENTITY_KEY);
}

async function waitForBridge(page: Page) {
  await page.waitForFunction(() => Boolean((window as Window & { __MODERNRPG_E2E__?: ModernRpgE2EBridge }).__MODERNRPG_E2E__));
}

async function openMesa(page: Page) {
  // `domcontentloaded` em vez do padrao `load`: este Chromium roda em
  // single-process e, com varios contextos e conexoes PeerJS vivas, o evento
  // `load` do terceiro contexto chega tarde por contencao de recursos.
  // A espera real e o waitForBridge logo abaixo — nenhuma assercao muda.
  await page.goto("/mesa/", { waitUntil: "domcontentloaded" });
  await waitForBridge(page);
  await expect(page.getByText("Mesa Online", { exact: true }).first()).toBeVisible();
}

async function snapshot(page: Page) {
  return page.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.snapshot());
}

/**
 * Observação determinística da autoridade: lê o registro DURÁVEL do último
 * resultado devolvido pelo Mestre para um comando.
 *
 * `multiplayer.error` não serve para isso — é transitório e o próprio
 * `request()` o zera a cada comando novo, o que tornava a asserção uma corrida.
 */
async function commandResult(page: Page, name: string) {
  return page.evaluate((command) => {
    const entry = (window as E2EWindow).__MODERNRPG_E2E__.lastCommandResult(command);
    return entry ? { ok: entry.ok, error: entry.error ?? "" } : null;
  }, name);
}

/** Motivo da recusa; string vazia enquanto não houver recusa registrada. */
async function refusalReason(page: Page, name: string): Promise<string> {
  const entry = await commandResult(page, name);
  return entry && !entry.ok ? entry.error : "";
}

async function tokenOnPage(page: Page, tokenId: string) {
  return (await snapshot(page)).board.tokens.find((token) => token.id === tokenId);
}

async function hostRoom(master: Page): Promise<string> {
  await master.getByRole("button", { name: /Criar sala online/ }).click();
  await expect(master.locator("[data-map-stage]")).toBeVisible();
  await expect.poll(async () => (await snapshot(master)).multiplayer.status).toBe("connected");
  return (await snapshot(master)).multiplayer.roomCode;
}

async function joinRoom(player: Page, roomCode: string): Promise<string> {
  await player.getByPlaceholder("CÓDIGO").fill(roomCode);
  await player.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(player.locator("[data-map-stage]")).toBeVisible();
  await expect.poll(async () => (await snapshot(player)).multiplayer.status).toBe("connected");
  const peerId = (await snapshot(player)).multiplayer.peerId;
  expect(peerId).not.toBe("");
  return peerId;
}

/** Atribuição de dono pelo caminho real de produção: painel de Elenco do Mestre. */
async function assignController(master: Page, tokenName: string, peerId: string) {
  await master.getByRole("button", { name: "Personagem" }).click();
  await master.locator(".mesa-roster-list > button").filter({ hasText: tokenName }).click();
  await master.getByLabel("Controle do token").selectOption(peerId);
  await master.locator('.mesa-left-drawer [aria-label="Fechar painel"]').click();
}

async function controllerOptions(master: Page, tokenName: string): Promise<string[]> {
  await master.getByRole("button", { name: "Personagem" }).click();
  await master.locator(".mesa-roster-list > button").filter({ hasText: tokenName }).click();
  const options = await master.getByLabel("Controle do token").locator("option").allTextContents();
  await master.locator('.mesa-left-drawer [aria-label="Fechar painel"]').click();
  return options;
}

const tokenBase = {
  accent: "#c99a45", hp: 30, hpMax: 40, pm: 15, pmMax: 20,
  defense: 18, initiative: 5, initiativeRoll: 0, luta: 6, pontaria: 8,
  damage: "1d6", crit: 20, critMultiplier: 2 as const, attackType: "ranged" as const, rangeM: 9,
  movementM: 9, level: 7, spellDC: 20, actionIds: [], tacticalActions: [],
  fortitude: 6, reflexes: 8, will: 10, conditions: [],
};

test("Mestre autoriza somente o Peer proprietário do personagem", async ({ browser }) => {
  const masterContext = await createContext(browser);
  const playerContext = await createContext(browser);
  const master = await masterContext.newPage();
  const player = await playerContext.newPage();

  await openMesa(master);
  const setup = await master.evaluate(() => {
    const api = (window as E2EWindow).__MODERNRPG_E2E__;
    const firstSceneId = api.snapshot().activeSceneId;
    api.addToken({
      id: "e2e-caster", name: "Conjuradora", title: "Arcanista 7", side: "heroes", gx: 1, gy: 1,
      symbol: "CO", accent: "#c99a45", hp: 30, hpMax: 40, pm: 15, pmMax: 20,
      defense: 18, initiative: 5, initiativeRoll: 0, luta: 6, pontaria: 8,
      damage: "1d6", crit: 20, critMultiplier: 2, attackType: "ranged", rangeM: 9,
      movementM: 9, level: 7, spellDC: 20, actionIds: [], tacticalActions: [{
        id: "e2e-bolt", name: "Dardo E2E", category: "weapon", kind: "standard", effect: "damage", target: "enemy",
        description: "Ataque autoritativo de teste.", pmCost: 0, rangeM: 12, damage: "1d4+1", autoHit: true, color: "arcane",
        // FIXTURE, nao asserção: o alvo fica a 4x3 casas do conjurador. Pela regra
        // T20 de dupla diagonal isso são 10,5 m — a fixture antiga assumia 6 m
        // (Chebyshev) e por isso um alcance de 9 m bastava. Ver tests/rangeRule.test.ts.
      }],
      fortitude: 6, reflexes: 8, will: 10, conditions: [],
    });
    const secondSceneId = api.createScene("Cena E2E 2");
    api.switchScene(firstSceneId);
    return { firstSceneId, secondSceneId };
  });

  const roomCode = await hostRoom(master);

  await openMesa(player);
  const playerPeerId = await joinRoom(player, roomCode);
  await expect.poll(async () => (await snapshot(master)).multiplayer.peers).toContain(playerPeerId);

  // O Mestre vincula controlledBy ao Peer real pelo painel de Elenco.
  await assignController(master, "Conjuradora", playerPeerId);
  await expect.poll(async () => (await tokenOnPage(player, "e2e-caster"))?.controlledBy).toBe(playerPeerId);

  // Movimento e vitais do próprio personagem percorrem Jogador → Mestre.
  await player.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.explorationMove("e2e-caster", 2, 1));
  await expect.poll(async () => (await tokenOnPage(master, "e2e-caster"))?.gx).toBe(2);
  await expect.poll(async () => (await commandResult(player, "explorationMove"))?.ok).toBe(true);
  await player.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.updateToken("e2e-caster", { hp: 24, pm: 12, conditions: ["Caído"] }));
  await expect.poll(async () => {
    const token = await tokenOnPage(master, "e2e-caster");
    return token && { hp: token.hp, pm: token.pm, conditions: token.conditions };
  }).toEqual({ hp: 24, pm: 12, conditions: ["Caído"] });
  await player.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.updateToken("e2e-caster", { controlledBy: "peer-injetado" }));
  await expect.poll(() => refusalReason(player, "updateToken")).toContain("só podem atualizar");
  expect((await tokenOnPage(master, "e2e-caster"))?.controlledBy).toBe(playerPeerId);

  // Jogador não inicia combate; o runtime do Mestre recusa o comando.
  await player.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.startCombat());
  await expect.poll(() => refusalReason(player, "startCombat")).toContain("autoridade do Mestre");
  expect((await snapshot(master)).combat.active).toBe(false);
  await master.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.startCombat());
  await expect.poll(async () => (await snapshot(player)).combat.active).toBe(true);
  expect((await snapshot(master)).combat.combatants).toHaveLength(1);

  // Movimento tático é validado e resolvido pelo runtime autoritativo do Mestre.
  await player.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.tacticalMove("e2e-caster", 3, 1));
  await expect.poll(async () => (await tokenOnPage(master, "e2e-caster"))?.gx).toBe(3);
  expect((await snapshot(master)).combat.resources["e2e-caster"].movement).toBe(0);

  // Invocações herdam controlledBy do conjurador.
  const summoned = await master.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.summon("e2e-caster"));
  expect(summoned).toHaveLength(6);
  await expect.poll(async () => (await snapshot(player)).board.tokens.filter((token) => token.summonedBy === "e2e-caster").length).toBe(6);
  expect((await snapshot(player)).board.tokens.filter((token) => token.summonedBy === "e2e-caster").every((token) => token.controlledBy === playerPeerId)).toBe(true);

  // Personagem alheio e ameaça são adicionados pelo Mestre após a iniciativa.
  await master.evaluate((base) => {
    const api = (window as E2EWindow).__MODERNRPG_E2E__;
    api.addToken({ ...base, id: "e2e-foreign", name: "Outro Herói", title: "Guerreiro 7", side: "heroes", gx: 6, gy: 3, symbol: "OH", controlledBy: "peer-de-outro-jogador" });
    api.addToken({ ...base, id: "e2e-threat", name: "Ameaça E2E", title: "ND 3", side: "threats", gx: 7, gy: 4, symbol: "AE", accent: "#8f2b3d", hp: 42, hpMax: 42, pm: 0, pmMax: 0 });
  }, tokenBase);
  await expect.poll(async () => (await snapshot(player)).board.tokens.map((token) => token.id)).toContain("e2e-foreign");

  // A ação enviada pelo Jogador é recalculada no Mestre a partir da ação canônica do token.
  await player.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.tacticalAction("e2e-caster", "e2e-bolt", ["e2e-threat"], { x: 7, y: 4 }));
  await expect.poll(async () => (await tokenOnPage(master, "e2e-threat"))?.hp).toBeLessThan(42);
  expect((await snapshot(master)).combat.resources["e2e-caster"].standard).toBe(0);

  // O CommandMenu só é habilitado no token cujo controlledBy coincide com o Peer atual.
  await player.getByRole("button", { name: /Abrir combate/ }).click();
  await expect(player.locator("[data-map-stage].combat-mode")).toBeVisible();
  await player.getByRole("button", { name: "Personagem" }).click();
  await expect(player.getByText("Meu personagem").first()).toBeVisible();
  await expect(player.getByText("Outro jogador")).toBeVisible();
  await player.locator('.mesa-left-drawer [aria-label="Fechar painel"]').click();
  await player.locator(".iso-unit, .token-2d").filter({ hasText: "Conjuradora" }).click({ force: true });
  await expect(player.locator(".combat-context .command-window")).toBeVisible();
  await expect(player.locator(".command-inspection-only")).toHaveCount(0);
  await player.locator(".iso-unit, .token-2d").filter({ hasText: "Outro" }).dispatchEvent("click");
  await expect(player.locator(".command-inspection-only")).toBeVisible();
  await expect(player.getByText("Personagem de outro jogador", { exact: true })).toBeVisible();
  await expect(player.locator(".combat-context .command-window")).toHaveCount(0);
  await player.locator(".iso-unit.threats, .token-2d.threats").first().click({ force: true });
  await expect(player.locator(".command-inspection-only")).toBeVisible();

  // Mesmo chamando a API diretamente, Jogador não encerra o combate.
  await player.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.endCombat());
  await expect.poll(() => refusalReason(player, "endCombat")).toContain("autoridade do Mestre");
  expect((await commandResult(player, "endCombat"))?.ok).toBe(false);
  expect((await snapshot(master)).combat.active).toBe(true);
  await player.getByRole("button", { name: /Voltar à exploração/ }).click();
  await expect(player.locator("[data-map-stage]")).toBeVisible();
  expect((await snapshot(master)).combat.active).toBe(true);
  await master.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.endCombat());
  await expect.poll(async () => (await snapshot(player)).combat.active).toBe(false);

  // Atualizar ou mover personagem alheio é recusado no servidor/runtime.
  await player.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.updateToken("e2e-foreign", { hp: 1 }));
  await expect.poll(() => refusalReason(player, "updateToken")).toContain("não controla");
  expect((await tokenOnPage(master, "e2e-foreign"))?.hp).toBe(30);
  await master.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.moveToken("e2e-foreign", 8, 3));
  await expect.poll(async () => (await tokenOnPage(player, "e2e-foreign"))?.gx).toBe(8);

  // Cenas também permanecem sob autoridade do Mestre.
  await player.evaluate((sceneId) => (window as E2EWindow).__MODERNRPG_E2E__.switchScene(sceneId), setup.secondSceneId);
  await expect.poll(() => refusalReason(player, "switchScene")).toContain("autoridade do Mestre");
  expect((await snapshot(master)).activeSceneId).toBe(setup.firstSceneId);
  await master.evaluate((sceneId) => (window as E2EWindow).__MODERNRPG_E2E__.switchScene(sceneId), setup.secondSceneId);
  await expect.poll(async () => (await snapshot(player)).activeSceneId).toBe(setup.secondSceneId);
  await master.evaluate((sceneId) => (window as E2EWindow).__MODERNRPG_E2E__.switchScene(sceneId), setup.firstSceneId);
  await expect.poll(async () => (await snapshot(player)).activeSceneId).toBe(setup.firstSceneId);
});

test("Jogador mantém o controle do token depois de recarregar a página", async ({ browser }) => {
  const masterContext = await createContext(browser);
  const playerContext = await createContext(browser);
  const master = await masterContext.newPage();
  const player = await playerContext.newPage();

  await openMesa(master);
  await master.evaluate((base) => {
    (window as E2EWindow).__MODERNRPG_E2E__.addToken({ ...base, id: "e2e-ranger", name: "Patrulheira", title: "Patrulheira 5", side: "heroes", gx: 1, gy: 1, symbol: "PT" });
  }, tokenBase);
  const roomCode = await hostRoom(master);

  await openMesa(player);
  const peerId = await joinRoom(player, roomCode);
  await assignController(master, "Patrulheira", peerId);
  await expect.poll(async () => (await tokenOnPage(player, "e2e-ranger"))?.controlledBy).toBe(peerId);

  await player.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.explorationMove("e2e-ranger", 2, 1));
  await expect.poll(async () => (await tokenOnPage(master, "e2e-ranger"))?.gx).toBe(2);

  // F5: a identidade persistida faz o jogador voltar como o MESMO peer e a
  // sessão salva o recoloca na sala sem passar pelo lobby.
  await player.reload();
  await waitForBridge(player);
  await expect.poll(async () => (await snapshot(player)).multiplayer.status).toBe("connected");
  expect((await snapshot(player)).multiplayer.peerId).toBe(peerId);
  expect((await snapshot(player)).multiplayer.role).toBe("player");
  await expect(player.locator("[data-map-stage]")).toBeVisible();
  await expect.poll(async () => (await snapshot(master)).multiplayer.peers).toContain(peerId);

  // Nenhuma reatribuição manual: o token continua sendo do mesmo jogador.
  expect((await tokenOnPage(master, "e2e-ranger"))?.controlledBy).toBe(peerId);
  await expect.poll(async () => (await tokenOnPage(player, "e2e-ranger"))?.controlledBy).toBe(peerId);
  await player.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.explorationMove("e2e-ranger", 3, 1));
  await expect.poll(async () => (await tokenOnPage(master, "e2e-ranger"))?.gx).toBe(3);
  await expect.poll(async () => (await commandResult(player, "explorationMove"))?.ok).toBe(true);
});

test("Dois jogadores reais controlam apenas os próprios personagens", async ({ browser }) => {
  const masterContext = await createContext(browser);
  const contextA = await createContext(browser);
  const contextB = await createContext(browser);
  const master = await masterContext.newPage();
  const playerA = await contextA.newPage();
  const playerB = await contextB.newPage();

  await openMesa(master);
  await master.evaluate((base) => {
    const api = (window as E2EWindow).__MODERNRPG_E2E__;
    api.addToken({ ...base, id: "e2e-alfa", name: "Herói Alfa", title: "Guerreiro 5", side: "heroes", gx: 1, gy: 1, symbol: "AL" });
    api.addToken({ ...base, id: "e2e-beta", name: "Herói Beta", title: "Ladina 5", side: "heroes", gx: 1, gy: 5, symbol: "BE" });
  }, tokenBase);
  const roomCode = await hostRoom(master);

  await openMesa(playerA);
  const peerA = await joinRoom(playerA, roomCode);
  await openMesa(playerB);
  const peerB = await joinRoom(playerB, roomCode);
  expect(peerA).not.toBe(peerB);
  await expect.poll(async () => (await snapshot(master)).multiplayer.peers.length).toBe(2);

  await assignController(master, "Herói Alfa", peerA);
  await assignController(master, "Herói Beta", peerB);
  await expect.poll(async () => (await tokenOnPage(playerA, "e2e-alfa"))?.controlledBy).toBe(peerA);
  await expect.poll(async () => (await tokenOnPage(playerB, "e2e-beta"))?.controlledBy).toBe(peerB);

  // Cada jogador move o próprio personagem.
  await playerA.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.explorationMove("e2e-alfa", 2, 1));
  await expect.poll(async () => (await tokenOnPage(master, "e2e-alfa"))?.gx).toBe(2);
  await playerB.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.explorationMove("e2e-beta", 2, 5));
  await expect.poll(async () => (await tokenOnPage(master, "e2e-beta"))?.gx).toBe(2);

  // A não controla o personagem de B.
  await playerA.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.explorationMove("e2e-beta", 4, 5));
  await expect.poll(() => refusalReason(playerA, "explorationMove")).toContain("não controla");
  await playerA.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.updateToken("e2e-beta", { hp: 1 }));
  await expect.poll(() => refusalReason(playerA, "updateToken")).toContain("não controla");

  // B não controla o personagem de A.
  await playerB.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.explorationMove("e2e-alfa", 4, 1));
  await expect.poll(() => refusalReason(playerB, "explorationMove")).toContain("não controla");
  await playerB.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.updateToken("e2e-alfa", { hp: 1 }));
  await expect.poll(() => refusalReason(playerB, "updateToken")).toContain("não controla");

  // Nada disso alterou o estado autoritativo do Mestre.
  expect((await tokenOnPage(master, "e2e-beta"))?.gx).toBe(2);
  expect((await tokenOnPage(master, "e2e-beta"))?.hp).toBe(30);
  expect((await tokenOnPage(master, "e2e-alfa"))?.gx).toBe(2);
  expect((await tokenOnPage(master, "e2e-alfa"))?.hp).toBe(30);

  // O Mestre continua com controle total sobre os dois.
  await master.evaluate(() => {
    const api = (window as E2EWindow).__MODERNRPG_E2E__;
    api.moveToken("e2e-alfa", 6, 1);
    api.moveToken("e2e-beta", 6, 5);
  });
  await expect.poll(async () => (await tokenOnPage(playerA, "e2e-alfa"))?.gx).toBe(6);
  await expect.poll(async () => (await tokenOnPage(playerB, "e2e-beta"))?.gx).toBe(6);

  // Cada jogador enxerga o próprio token como seu e o do colega como alheio.
  await playerA.getByRole("button", { name: "Personagem" }).click();
  await expect(playerA.getByText("Meu personagem")).toHaveCount(1);
  await expect(playerA.getByText("Outro jogador")).toHaveCount(1);
});

test("Queda e reentrada do jogador preservam controlledBy sem reatribuição", async ({ browser }) => {
  const masterContext = await createContext(browser);
  const playerContext = await createContext(browser);
  const master = await masterContext.newPage();
  const player = await playerContext.newPage();

  await openMesa(master);
  await master.evaluate((base) => {
    (window as E2EWindow).__MODERNRPG_E2E__.addToken({ ...base, id: "e2e-cleric", name: "Clériga", title: "Clériga 6", side: "heroes", gx: 1, gy: 2, symbol: "CL" });
  }, tokenBase);
  const roomCode = await hostRoom(master);

  await openMesa(player);
  const peerId = await joinRoom(player, roomCode);
  await assignController(master, "Clériga", peerId);
  await expect.poll(async () => (await tokenOnPage(player, "e2e-cleric"))?.controlledBy).toBe(peerId);
  expect((await controllerOptions(master, "Clériga")).some((option) => option.startsWith("Offline"))).toBe(false);

  // Queda: o jogador perde a conexão com a mesa.
  await player.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.leaveRoom());
  await expect.poll(async () => (await snapshot(master)).multiplayer.peers).not.toContain(peerId);

  // O token NÃO é liberado: continua atribuído ao jogador ausente…
  expect((await tokenOnPage(master, "e2e-cleric"))?.controlledBy).toBe(peerId);
  // …e a UI do Mestre passa a marcá-lo como Offline.
  expect((await controllerOptions(master, "Clériga")).some((option) => option.startsWith("Offline"))).toBe(true);

  // Reentrada na mesma sala: identidade persistida devolve o mesmo peerId.
  await player.evaluate((code) => (window as E2EWindow).__MODERNRPG_E2E__.joinRoom(code), roomCode);
  await expect.poll(async () => (await snapshot(player)).multiplayer.status).toBe("connected");
  expect((await snapshot(player)).multiplayer.peerId).toBe(peerId);
  await expect.poll(async () => (await snapshot(master)).multiplayer.peers).toContain(peerId);

  // O rótulo Offline some sozinho e o controle volta sem nenhuma reatribuição.
  expect((await controllerOptions(master, "Clériga")).some((option) => option.startsWith("Offline"))).toBe(false);
  expect((await tokenOnPage(master, "e2e-cleric"))?.controlledBy).toBe(peerId);
  await player.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.explorationMove("e2e-cleric", 3, 2));
  await expect.poll(async () => (await tokenOnPage(master, "e2e-cleric"))?.gx).toBe(3);
  await expect.poll(async () => (await commandResult(player, "explorationMove"))?.ok).toBe(true);
});

test("Reentrada automática em segunda aba avisa a colisão sem quebrar a autoridade", async ({ browser }) => {
  // Tres contextos de navegador simultaneos (Mestre, Jogador e a 2a aba) num
  // Chromium single-process. O teste nao e lento por defeito do produto: e o
  // ambiente que serializa. Folga de tempo, assercoes intactas.
  test.slow();
  const masterContext = await createContext(browser);
  const playerContext = await createContext(browser);
  const master = await masterContext.newPage();
  const player = await playerContext.newPage();

  await openMesa(master);
  await master.evaluate((base) => {
    (window as E2EWindow).__MODERNRPG_E2E__.addToken({ ...base, id: "e2e-bard", name: "Bardo", title: "Bardo 5", side: "heroes", gx: 1, gy: 1, symbol: "BA" });
  }, tokenBase);
  const roomCode = await hostRoom(master);

  await openMesa(player);
  const peerId = await joinRoom(player, roomCode);
  await assignController(master, "Bardo", peerId);
  await expect.poll(async () => (await tokenOnPage(player, "e2e-bard"))?.controlledBy).toBe(peerId);
  const identityBefore = await storedIdentity(player);

  // Segunda aba do mesmo navegador: o restore automático dispara sozinho e
  // colide com o peer que a primeira aba mantém aberto.
  const secondTab = await openSecondTab(browser, identityBefore);
  await secondTab.goto("/mesa/", { waitUntil: "domcontentloaded" });
  await waitForBridge(secondTab);

  // A mensagem aparece SEM nenhum clique, no mesmo lugar do caminho manual.
  const notice = secondTab.locator(".mesa-connect-notice");
  await expect(notice).toBeVisible({ timeout: 30_000 });
  await expect(notice).toContainText("já está aberta em outra aba");
  await expect(secondTab.locator(".mesa-lobby")).toBeVisible();
  await expect(secondTab.locator("[data-map-stage]")).toHaveCount(0);

  // Nenhum peer novo foi inventado e a identidade continua intacta.
  expect((await snapshot(master)).multiplayer.peers).toEqual([peerId]);
  expect((await snapshot(secondTab)).multiplayer.peerId).not.toBe(peerId);
  expect((await snapshot(secondTab)).multiplayer.status).toBe("error");
  expect(await storedIdentity(secondTab)).toBe(identityBefore);

  // A aba original segue dona do token e com autoridade funcionando.
  expect((await tokenOnPage(master, "e2e-bard"))?.controlledBy).toBe(peerId);
  await expect.poll(async () => (await snapshot(player)).multiplayer.status).toBe("connected");
  await player.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.explorationMove("e2e-bard", 2, 1));
  await expect.poll(async () => (await tokenOnPage(master, "e2e-bard"))?.gx).toBe(2);
  await expect.poll(async () => (await commandResult(player, "explorationMove"))?.ok).toBe(true);
});

test("Jogador edita PV, PM e condições do próprio personagem pela UI real", async ({ browser }) => {
  const masterContext = await createContext(browser);
  const playerContext = await createContext(browser);
  const master = await masterContext.newPage();
  const player = await playerContext.newPage();

  await openMesa(master);
  await master.evaluate((base) => {
    const api = (window as E2EWindow).__MODERNRPG_E2E__;
    api.addToken({ ...base, id: "e2e-cleric", name: "Clériga", title: "Clériga 5", side: "heroes", gx: 1, gy: 1, symbol: "CL" });
    api.addToken({ ...base, id: "e2e-other", name: "Ladino", title: "Ladino 5", side: "heroes", gx: 5, gy: 5, symbol: "LA", controlledBy: "peer-de-outro-jogador", conditions: ["Abalado"] });
  }, tokenBase);
  const roomCode = await hostRoom(master);

  await openMesa(player);
  const peerId = await joinRoom(player, roomCode);
  await assignController(master, "Clériga", peerId);
  await expect.poll(async () => (await tokenOnPage(player, "e2e-cleric"))?.controlledBy).toBe(peerId);

  // O Mestre fica com OUTRO token selecionado: o snapshot dele não pode roubar
  // a seleção do jogador a cada broadcast.
  await master.getByRole("button", { name: "Personagem" }).click();
  await master.locator(".mesa-roster-list > button").filter({ hasText: "Ladino" }).click();
  await master.locator('.mesa-left-drawer [aria-label="Fechar painel"]').click();

  // Seleção pela UI real do tabuleiro, sem passar pelo bridge.
  await player.locator("[data-token-id]").filter({ hasText: "Clériga" }).dispatchEvent("click");
  await expect(player.locator(".mesa-token-context")).toBeVisible();

  await player.getByRole("button", { name: "Reduzir PV" }).click();
  await player.getByRole("button", { name: "Reduzir PV" }).click();
  await expect.poll(async () => (await tokenOnPage(master, "e2e-cleric"))?.hp).toBe(28);
  await player.getByRole("button", { name: "Aumentar PV" }).click();
  await expect.poll(async () => (await tokenOnPage(master, "e2e-cleric"))?.hp).toBe(29);
  await player.getByRole("button", { name: "Reduzir PM" }).click();
  await expect.poll(async () => (await tokenOnPage(master, "e2e-cleric"))?.pm).toBe(14);
  // O painel continua na Clériga depois dos ecos do Mestre.
  await expect(player.locator(".mesa-token-context")).toContainText("Clériga");

  // Condição própria pelo mesmo token.conditions que o Mestre já usa. Na
  // exploração o formulário é progressivo: só surge na aba de efeitos.
  await player.getByRole("button", { name: "Ver condições e efeitos" }).click();
  await player.getByPlaceholder("Adicionar condição").fill("Atordoado");
  await player.getByPlaceholder("Adicionar condição").press("Enter");
  await expect.poll(async () => (await tokenOnPage(master, "e2e-cleric"))?.conditions).toEqual(["Atordoado"]);
  await player.getByTitle("Remover Atordoado").click();
  await expect.poll(async () => (await tokenOnPage(master, "e2e-cleric"))?.conditions).toEqual([]);

  // Token alheio não substitui a ficha persistente do personagem próprio;
  // a tentativa administrativa ainda é recusada pelo runtime.
  await player.getByRole("button", { name: "Ver condições e efeitos" }).click();
  await player.locator("[data-token-id]").filter({ hasText: "Ladino" }).dispatchEvent("click");
  await expect(player.locator(".mesa-token-context")).toBeVisible();
  await expect(player.locator(".mesa-token-context")).toContainText("Clériga");
  await expect(player.getByText("Somente inspeção")).toHaveCount(0);
  await expect(player.locator(".mesa-vital-steppers")).toHaveCount(2);
  await expect(player.locator(".mesa-condition-add")).toHaveCount(0);
  await player.evaluate(() => (window as E2EWindow).__MODERNRPG_E2E__.updateToken("e2e-other", { hp: 1, conditions: ["Caído"] }));
  await expect.poll(() => refusalReason(player, "updateToken")).toContain("não controla");
  const foreign = await tokenOnPage(master, "e2e-other");
  expect({ hp: foreign?.hp, conditions: foreign?.conditions }).toEqual({ hp: 30, conditions: ["Abalado"] });
});
