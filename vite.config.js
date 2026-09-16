import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync, readFileSync, copyFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

function localFilePlugin() {
  return {
    name: 'local-file-fix',
    closeBundle() {
      const distHtml = resolve(__dirname, 'dist/index.html')
      try {
        let html = readFileSync(distHtml, 'utf-8')

        // 1. Strip type="module" — browsers block ES modules on file://
        html = html.replace(/\s*type="module"/g, '')
        // 2. Strip crossorigin
        html = html.replace(/\s*crossorigin/g, '')
        // 3. Remove any defer already added to avoid duplication
        html = html.replace(/\s*defer/g, '')
        // 4. Move all <script src=...> from wherever they are to end of <body>
        //    and add defer so DOM is ready
        const scriptRe = /<script\s+src="([^"]+)"[^>]*><\/script>/g
        const scripts = [...html.matchAll(scriptRe)]
        scripts.forEach(m => { html = html.replace(m[0], '') })
        const scriptTags = scripts.map(m => `  <script defer src="${m[1]}"></script>`).join('\n')
        html = html.replace('</body>', `${scriptTags}\n</body>`)

        // Write patched dist/index.html
        writeFileSync(distHtml, html, 'utf-8')
        console.log('✓ dist/index.html patched for file:// compatibility')

        // Also copy assets folder reference check and write WarSim.html at project root
        // with paths pointing into dist/assets/
        const rootHtml = html
          .replace(/src="\.\/assets\//g, 'src="./dist/assets/')
          .replace(/href="\.\/assets\//g, 'href="./dist/assets/')
        writeFileSync(resolve(__dirname, 'WarSim.html'), rootHtml, 'utf-8')
        console.log('✓ WarSim.html written at project root (open this directly)')

      } catch (e) {
        console.warn('Post-build patch failed:', e.message)
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
