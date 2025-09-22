import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Custom plugin to copy the example HTML file to dist
    {
      name: 'copy-example-html',
      closeBundle() {
        // Copy the example HTML from public to dist
        const publicHtmlPath = path.resolve(__dirname, 'public/index.html')
        const distHtmlPath = path.resolve(__dirname, 'dist/index.html')

        // Copy the file
        fs.copyFileSync(publicHtmlPath, distHtmlPath)
        console.log('✅ Example HTML copied to dist/index.html')
      }
    }
  ],
  publicDir: 'public',
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    manifest: true, // This enables the manifest.json generation
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
})
