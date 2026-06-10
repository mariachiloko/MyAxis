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
cp -R "${ROOT_DIR}/assets" "${DIST_DIR}/assets"

DIST_DIR="${DIST_DIR}" python3 - <<'PY'
import json
import os
from pathlib import Path

dist_dir = Path(os.environ["DIST_DIR"])
region = os.environ.get("MYAXIS_COGNITO_REGION", "").strip()
hosted_ui_domain = os.environ.get("MYAXIS_COGNITO_HOSTED_UI_DOMAIN", "").strip()
if hosted_ui_domain and not hosted_ui_domain.startswith("http") and ".auth." not in hosted_ui_domain and ".amazoncognito.com" not in hosted_ui_domain and region:
    hosted_ui_domain = f"{hosted_ui_domain}.auth.{region}.amazoncognito.com"
runtime_config = {
    "apiBaseUrl": os.environ.get("MYAXIS_API_BASE_URL", "").strip(),
    "aiModel": os.environ.get("MYAXIS_AI_MODEL", "").strip(),
    "cognitoRegion": region,
    "cognitoUserPoolId": os.environ.get("MYAXIS_COGNITO_USER_POOL_ID", "").strip(),
    "cognitoClientId": os.environ.get("MYAXIS_COGNITO_CLIENT_ID", "").strip(),
    "cognitoHostedUiDomain": hosted_ui_domain,
    "cognitoRedirectUri": os.environ.get("MYAXIS_COGNITO_REDIRECT_URI", "").strip(),
    "cognitoLogoutUri": os.environ.get("MYAXIS_COGNITO_LOGOUT_URI", "").strip(),
    "spotifyClientId": os.environ.get("MYAXIS_SPOTIFY_CLIENT_ID", "").strip(),
    "spotifyRedirectUri": os.environ.get("MYAXIS_SPOTIFY_REDIRECT_URI", "").strip(),
    "googleClientId": os.environ.get("MYAXIS_GOOGLE_CLIENT_ID", "").strip(),
    "googleRedirectUri": os.environ.get("MYAXIS_GOOGLE_REDIRECT_URI", "").strip()
}
(dist_dir / "runtime-config.js").write_text(
    "window.__MYAXIS_RUNTIME_CONFIG__ = " + json.dumps(runtime_config, indent=2) + ";\n",
    encoding="utf-8"
)
PY
