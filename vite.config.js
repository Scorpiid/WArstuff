import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync, readFileSync } from 'fs'
import { resolve } from 'path'

// Plugin that rewrites the built index.html so it works on file://
// Removes type="module" and crossorigin from script/link tags
function localFilePlugin() {
  return {
    name: 'local-file-fix',
    closeBundle() {
      const htmlPath = resolve(__dirname, 'dist/index.html')
      try {
        let html = readFileSync(htmlPath, 'utf-8')
        // Remove type="module" from script tags
        html = html.replace(/\s*type="module"/g, '')
        // Remove crossorigin attribute
        html = html.replace(/\s*crossorigin/g, '')
        writeFileSync(htmlPath, html, 'utf-8')
        console.log('✓ index.html patched for file:// compatibility')
      } catch (e) {
        console.warn('Could not patch index.html:', e.message)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), localFilePlugin()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        inlineDynamicImports: true,
      },
    },
  },
})
