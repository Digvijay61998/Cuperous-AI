import react from "@vitejs/plugin-react";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [dts(), cssInjectedByJsPlugin(), react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
  build: {
    lib: {
      entry: "src/main.tsx",
      name: "bizbot",
      fileName: "plugin",
    },
    outDir: "dist",
  },
});
