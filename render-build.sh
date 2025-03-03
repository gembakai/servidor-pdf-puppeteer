#!/usr/bin/env bash
set -o errexit  # Detener el proceso si hay un error

# Instalar dependencias
npm install

# Asegurar que el directorio de caché de Puppeteer exista
PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
mkdir -p $PUPPETEER_CACHE_DIR

# Instalar Puppeteer y descargar Chromium
npx puppeteer browsers install chrome

# Almacenar o recuperar la caché de Puppeteer
if [[ ! -d $PUPPETEER_CACHE_DIR ]]; then
    echo "...Copiando caché de Puppeteer desde la caché de construcción"
    cp -R /opt/render/project/src/.cache/puppeteer/chrome/ $PUPPETEER_CACHE_DIR
else
    echo "...Almacenando caché de Puppeteer en la caché de construcción"
    cp -R $PUPPETEER_CACHE_DIR /opt/render/project/src/.cache/puppeteer/chrome/
fi
