import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Content script
        content: resolve(__dirname, 'src/content/content-fixed.js'),
        // Background script
        background: resolve(__dirname, 'src/background/background.js'),
        // Sidebar React app
        sidebar: resolve(__dirname, 'src/sidebar/sidebar-fixed.html'),
        // Popup React app
        popup: resolve(__dirname, 'src/popup/popup.html')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep original names for scripts
          if (chunkInfo.name === 'content' || chunkInfo.name === 'background') {
            return '[name].js'
          }
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep HTML files in root
          if (assetInfo.name && assetInfo.name.endsWith('.html')) {
            return '[name][extname]'
          }
          // Keep CSS files with proper names
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
    // Ensure we can use chrome APIs
    target: 'es2020'
  },
  define: {
    // Define chrome as global for development
    global: 'globalThis'
  }
})
