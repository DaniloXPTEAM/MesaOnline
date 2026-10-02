import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
    // Os catálogos (bestiário, magias, poderes) são grandes e cada arquivo de teste
    // sobe um jsdom próprio; em paralelo o primeiro import passa dos 5 s padrão.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
