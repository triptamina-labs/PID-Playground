
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { DEV_CONFIG } from "./src/config/app.config";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: DEV_CONFIG.server.host,
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  worker: {
    format: DEV_CONFIG.test.environment === 'jsdom' ? 'es' : 'es',
  },
  optimizeDeps: {
    exclude: ['src/workers/simulation.worker.ts']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select', 
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip'
          ],
          'charts': ['recharts'],
          'icons': ['lucide-react'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod']
        }
      }
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    minify: 'esbuild', // esbuild está incluido por defecto, es más rápido
    target: 'es2020'
  }
});
