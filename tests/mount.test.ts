import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeToken } from "./helpers";

describe("montaria (legado: montar / desmontar / seguirMontaria)", () => {
  beforeEach(() => { localStorage.clear(); vi.resetModules(); });

  async function setup() {
    const bridge = await import("../src/game/vttBridge");
    const commands = await import("../src/tactics/engine/mountCommands");
    const rider = makeToken({ id: "cav", name: "Alyssa", gx: 2, gy: 2 });
    const mount = makeToken({ id: "cavalo", name: "Cavalo de guerra", gx: 3, gy: 2, size: "grande" });
    bridge.addToken(rider);
    bridge.addToken(mount);
    return { bridge, commands };
  }

  it("monta: o cavaleiro vai para a casa da montaria e os dois ficam ligados", async () => {
    const { bridge, commands } = await setup();
    commands.executeMount("cav", "cavalo");
    const tokens = bridge.getBoard().tokens;
    const rider = tokens.find((token) => token.id === "cav")!;
    const mount = tokens.find((token) => token.id === "cavalo")!;
    expect(rider.mountId).toBe("cavalo");
    expect(mount.riderId).toBe("cav");
    expect([rider.gx, rider.gy]).toEqual([mount.gx, mount.gy]);
  });

  it("o par anda junto, qualquer um dos dois que se mova", async () => {
    const { bridge, commands } = await setup();
    commands.executeMount("cav", "cavalo");
    bridge.moveToken("cavalo", 6, 5);
    let tokens = bridge.getBoard().tokens;
    expect([tokens.find((t) => t.id === "cav")!.gx, tokens.find((t) => t.id === "cav")!.gy]).toEqual([6, 5]);
    bridge.moveToken("cav", 7, 5);
    tokens = bridge.getBoard().tokens;
    expect([tokens.find((t) => t.id === "cavalo")!.gx, tokens.find((t) => t.id === "cavalo")!.gy]).toEqual([7, 5]);
  });

  it("desmonta: o cavaleiro desce numa casa livre ao lado e a ligação some", async () => {
    const { bridge, commands } = await setup();
    commands.executeMount("cav", "cavalo");
    commands.executeDismount("cav");
    const tokens = bridge.getBoard().tokens;
    const rider = tokens.find((token) => token.id === "cav")!;
    const mount = tokens.find((token) => token.id === "cavalo")!;
    expect(rider.mountId).toBeUndefined();
    expect(mount.riderId).toBeUndefined();
    expect(Math.max(Math.abs(rider.gx - mount.gx), Math.abs(rider.gy - mount.gy))).toBe(1);
  });

  it("recusa montar longe (mais de 1 quadrado), em token já montado ou de outro lado", async () => {
    const { bridge, commands } = await setup();
    bridge.moveToken("cavalo", 10, 10);
    expect(() => commands.executeMount("cav", "cavalo")).toThrow(/1 quadrado/);
    bridge.moveToken("cavalo", 3, 2);
    const inimigo = makeToken({ id: "lobo", name: "Lobo", side: "threats", gx: 4, gy: 2, size: "grande" });
    bridge.addToken(inimigo);
    expect(() => commands.executeMount("cav", "lobo")).toThrow(/mesmo lado/);
    commands.executeMount("cav", "cavalo");
    expect(() => commands.executeMount("cav", "cavalo")).toThrow(/já está/);
  });

  it("em combate, montar, desmontar, pegar e soltar item gastam a ação de movimento (e a padrão vira movimento depois dela)", async () => {
    const { bridge, commands } = await setup();
    const objects = await import("../src/tactics/engine/objectCommands");
    bridge.addToken(makeToken({ id: "inim", name: "Bandido", side: "threats", gx: 9, gy: 9 }));
    bridge.startCombat();
    const first = bridge.getCombatState().activeTokenId!;
    if (first !== "cav") { while (bridge.getCombatState().activeTokenId !== "cav") bridge.endTurn(); }
    const left = () => bridge.getCombatState().resources.cav;
    expect(left().movement).toBe(1);
    commands.executeMount("cav", "cavalo");
    expect(left().movement).toBe(0);
    commands.executeDismount("cav");
    expect(left().standard).toBe(0); // sem ação de movimento sobra a padrão, usada como movimento
    expect(() => objects.executeDropItem("cav", { name: "Corda" })).toThrow(/ação/i);
  });
});
