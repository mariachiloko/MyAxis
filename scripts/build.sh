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

DIST_DIR="${DIST_DIR}" python3 - <<'PY'
import json
import os
from pathlib import Path

dist_dir = Path(os.environ["DIST_DIR"])
runtime_config = {
    "apiBaseUrl": os.environ.get("MYAXIS_API_BASE_URL", "").strip(),
    "cognitoRegion": os.environ.get("MYAXIS_COGNITO_REGION", "").strip(),
    "cognitoUserPoolId": os.environ.get("MYAXIS_COGNITO_USER_POOL_ID", "").strip(),
    "cognitoClientId": os.environ.get("MYAXIS_COGNITO_CLIENT_ID", "").strip(),
    "cognitoHostedUiDomain": os.environ.get("MYAXIS_COGNITO_HOSTED_UI_DOMAIN", "").strip(),
    "cognitoRedirectUri": os.environ.get("MYAXIS_COGNITO_REDIRECT_URI", "").strip(),
    "cognitoLogoutUri": os.environ.get("MYAXIS_COGNITO_LOGOUT_URI", "").strip()
}
(dist_dir / "runtime-config.js").write_text(
    "window.__MYAXIS_RUNTIME_CONFIG__ = " + json.dumps(runtime_config, indent=2) + ";\n",
    encoding="utf-8"
)
PY
