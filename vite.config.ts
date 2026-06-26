import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8')) as { name: string }

// GitHub Pages serves the site from /<repo-name>/, so the base path must
// match the package name (which is also the repo name): "dailydrip".
export default defineConfig({
  plugins: [react()],
  base: `/${pkg.name}/`,
})
