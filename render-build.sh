#!/usr/bin/env bash
set -o errexit  # Salir en caso de error

# Instalar dependencias
npm install

# Definir el directorio de caché de Puppeteer
PUPPETEER_CACHE_DIR=./.cache/puppeteer
mkdir -p $PUPPETEER_CACHE_DIR

# Instalar Puppeteer y descargar Chromium
npx puppeteer install

# Verificar si Chromium se descargó correctamente
if [ -f "$PUPPETEER_CACHE_DIR/chrome/linux-*/chrome-linux/chrome" ]; then
  echo "Chromium se descargó correctamente."
else
  echo "Error: Chromium no se descargó."
  exit 1
fi
