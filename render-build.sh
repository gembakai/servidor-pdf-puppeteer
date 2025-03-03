#!/usr/bin/env bash
set -o errexit  # Detener el script en caso de error

echo "📦 Instalando dependencias..."
npm install

echo "📂 Creando directorio de caché de Puppeteer..."
mkdir -p /opt/render/.cache/puppeteer

echo "⬇️ Instalando Chromium con Puppeteer..."
npx puppeteer browsers install chrome

echo "🔍 Verificando ruta de instalación de Chromium..."
CHROME_PATH=$(npx puppeteer browsers path chrome)
echo "✅ Chromium instalado en: $CHROME_PATH"

echo "✅ Instalación completada."
