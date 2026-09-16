import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // MapLibre's prebuilt renderer contains one indivisible module just over
    // Vite's 500 kB default. It is lazy-loaded and isolated below.
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Keep route and vendor chunks below Vite's warning threshold. MapLibre
        // is intentionally loaded only by map routes and is large enough to
        // benefit from being split into cacheable sub-chunks.
        codeSplitting: {
          groups: [
            {
              name: 'maplibre',
              test: /node_modules[\\/]maplibre-gl/,
              maxSize: 450 * 1024,
            },
          ],
        },
      },
    },
  },
  // MapLibre v6 ships its renderer and module worker separately. Let Vite's
  // worker pipeline handle that file instead of moving only the renderer into
  // the dependency-optimization cache.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
