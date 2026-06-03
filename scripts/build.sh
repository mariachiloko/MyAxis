#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"

rm -rf "${DIST_DIR}"
mkdir -p "${DIST_DIR}"

cp "${ROOT_DIR}/index.html" "${DIST_DIR}/index.html"
cp "${ROOT_DIR}/app.js" "${DIST_DIR}/app.js"
cp "${ROOT_DIR}/styles.css" "${DIST_DIR}/styles.css"
cp "${ROOT_DIR}/config.example.js" "${DIST_DIR}/config.example.js"
cp "${ROOT_DIR}/config.schema.json" "${DIST_DIR}/config.schema.json"
