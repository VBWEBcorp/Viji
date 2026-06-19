import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Valeurs déterministes pour les tests (lien de désinscription, secret HMAC).
    env: {
      NEXT_PUBLIC_APP_URL: "https://entremamanetmoi.test",
      AUTH_SECRET: "test-secret-for-newsletter",
    },
  },
});
