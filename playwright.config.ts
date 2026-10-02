import chromiumPack, { inflate, setupLambdaEnvironment } from "@sparticuz/chromium";
import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// O Chromium empacotado (@sparticuz/chromium) é só para Linux (o CI Arena). No Windows/macOS usa o Chromium
// instalado pelo próprio Playwright (`npx playwright install chromium`).
const usePackedChromium = process.platform === "linux";
const executablePath = usePackedChromium ? await chromiumPack.executablePath() : undefined;
if (usePackedChromium) {
  // O pacote só extrai estas bibliotecas automaticamente em Amazon Linux; o CI Arena usa Debian sem apt/root.
  await inflate(resolve("node_modules/@sparticuz/chromium/bin/al2023.tar.br"));
  setupLambdaEnvironment(join(tmpdir(), "al2023", "lib"));
}

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  /**
   * Este Chromium roda em --single-process (exigencia do @sparticuz/chromium
   * neste ambiente). Os testes de multijogador abrem varios BrowserContexts
   * com PeerJS/WebRTC e NAO podem fecha-los: context.close() derruba o browser
   * inteiro em single-process. Ao final da suite ha mais de uma dezena de
   * contextos vivos disputando um unico processo, e o custo de abrir a proxima
   * pagina cresce — dai timeouts intermitentes em testes que nada tem de lento.
   *
   * O limite abaixo cobre essa contencao do AMBIENTE. Nenhuma assercao foi
   * afrouxada; o que muda e quanto tempo se espera pela maquina.
   */
  timeout: 150_000,
  expect: { timeout: 20_000 },
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4174",
    browserName: "chromium",
    headless: true,
    launchOptions: usePackedChromium ? { executablePath, args: chromiumPack.args } : {},
  },
  webServer: [
    {
      command: "npm run dev -- --host 0.0.0.0 --port 4174 --strictPort --mode e2e",
      url: "http://127.0.0.1:4174",
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: "node tests/e2e/peer-server.mjs",
      port: 9000,
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
