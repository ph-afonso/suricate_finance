// Gera os ícones do app (PWA, favicon, Apple) a partir do desenho do Suri.
// Uso: npm run icones (na pasta frontend)
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const pasta = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons')
mkdirSync(pasta, { recursive: true })

const pelo = '#C98E5A'
const barriga = '#EED3B0'
const escuro = '#3B2A1E'
const suri = `
  <path d="M86 140 q22 -6 18 -34" stroke="${pelo}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <ellipse cx="60" cy="112" rx="30" ry="40" fill="${pelo}"/>
  <ellipse cx="60" cy="118" rx="18" ry="30" fill="${barriga}"/>
  <path d="M40 100 q14 10 22 0 M80 100 q-14 10 -22 0" stroke="${pelo}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <ellipse cx="60" cy="52" rx="25" ry="23" fill="${pelo}"/>
  <circle cx="37" cy="40" r="6" fill="${pelo}"/><circle cx="83" cy="40" r="6" fill="${pelo}"/>
  <circle cx="37" cy="40" r="3" fill="${escuro}"/><circle cx="83" cy="40" r="3" fill="${escuro}"/>
  <ellipse cx="49" cy="50" rx="7.5" ry="8.5" fill="${escuro}"/><ellipse cx="71" cy="50" rx="7.5" ry="8.5" fill="${escuro}"/>
  <circle cx="50" cy="49" r="3.4" fill="#fff"/><circle cx="70" cy="49" r="3.4" fill="#fff"/>
  <ellipse cx="60" cy="60" rx="9" ry="7" fill="${barriga}"/>
  <ellipse cx="60" cy="57.5" rx="3.6" ry="2.6" fill="${escuro}"/>
  <path d="M53 64 q7 8 14 0" stroke="${escuro}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`

// Ícone quadrado: fundo Areia com o Suri centralizado, com margem para o recorte dos launchers
const quadrado = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="0" fill="#FBF7F2"/>
  <g transform="translate(55 26) scale(0.75)">${suri}</g></svg>`
// Favicon em SVG, sem fundo
const solto = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 10 100 150">${suri}</svg>`

const tamanhos = {
  'icon-128x128.png': 128,
  'icon-192x192.png': 192,
  'icon-256x256.png': 256,
  'icon-384x384.png': 384,
  'icon-512x512.png': 512,
  'apple-icon-120x120.png': 120,
  'apple-icon-152x152.png': 152,
  'apple-icon-167x167.png': 167,
  'apple-icon-180x180.png': 180,
  'ms-icon-144x144.png': 144,
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,
  'favicon-96x96.png': 96,
  'favicon-128x128.png': 128,
}

for (const [nome, px] of Object.entries(tamanhos)) {
  await sharp(Buffer.from(quadrado)).resize(px, px).png().toFile(resolve(pasta, nome))
}
writeFileSync(resolve(pasta, 'suri.svg'), solto)
writeFileSync(resolve(pasta, 'safari-pinned-tab.svg'), solto)
console.log(`${Object.keys(tamanhos).length} ícones gerados em ${pasta}`)
