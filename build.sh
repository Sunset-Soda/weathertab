#!/usr/bin/env bash
# Builds the Firefox and Chrome packages into dist/ (and docs/downloads/ for the website).
set -euo pipefail
cd "$(dirname "$0")"
VERSION=$(python3 -c "import json;print(json.load(open('manifests/firefox.json'))['version'])")
rm -rf dist && mkdir -p dist/firefox dist/chrome docs/downloads

for target in firefox chrome; do
  cp src/newtab.html src/newtab.css src/newtab.js src/icon.svg "dist/$target/"
  cp "manifests/$target.json" "dist/$target/manifest.json"
done

# Chrome does not accept SVG icons in the manifest, so ship pre-rendered PNGs
cp assets/icon16.png assets/icon32.png assets/icon48.png assets/icon128.png dist/chrome/

(cd dist/firefox && zip -qr "../weathertab-firefox-$VERSION.xpi" .)
(cd dist/chrome  && zip -qr "../weathertab-chrome-$VERSION.zip" .)
cp "dist/weathertab-firefox-$VERSION.xpi" docs/downloads/weathertab-firefox.xpi
cp "dist/weathertab-chrome-$VERSION.zip"  docs/downloads/weathertab-chrome.zip
echo "Built version $VERSION:"; ls -1 dist/*.xpi dist/*.zip
