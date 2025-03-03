#!/usr/bin/env bash
set -o errexit  # Detener el script en caso de error

echo "📦 Instalando dependencias..."
npm install

echo "📂 Creando directorio de caché de Puppeteer..."
mkdir -p /opt/render/.cache/puppeteer

echo "⬇️ Instalando Chromium con Puppeteer..."
npx puppeteer install

echo "✅ Instalación completada."
