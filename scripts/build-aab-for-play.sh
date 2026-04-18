#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v gradle >/dev/null 2>&1; then
  echo "❌ gradle is not installed or not in PATH"
  exit 1
fi

if ! command -v java >/dev/null 2>&1; then
  echo "❌ java is not installed or not in PATH"
  exit 1
fi

JAVA_MAJOR="$(java -version 2>&1 | awk -F '[\".]' '/version/ {print $2; exit}')"
if [[ -n "${JAVA_MAJOR}" && "${JAVA_MAJOR}" -gt 21 ]]; then
  echo "❌ Detected Java ${JAVA_MAJOR}. This project builds reliably with Java 17 or 21."
  echo "   Set JAVA_HOME to a JDK 17/21 installation, then try again."
  exit 1
fi

if [[ ! -f "keystore.properties" ]]; then
  cat <<'MSG'
❌ Missing keystore.properties.
Create /workspace/BuySel/keystore.properties with:
  storeFile=/absolute/path/to/upload-keystore.jks
  storePassword=your_store_password
  keyAlias=upload
  keyPassword=your_key_password

You can also export env vars instead:
  ANDROID_STORE_FILE
  ANDROID_STORE_PASSWORD
  ANDROID_KEY_ALIAS
  ANDROID_KEY_PASSWORD
MSG
  exit 1
fi

echo "▶ Building signed AAB (app bundle)"
gradle :app:bundleRelease

AAB_PATH="app/build/outputs/bundle/release/app-release.aab"
if [[ -f "$AAB_PATH" ]]; then
  echo "✅ AAB generated: $AAB_PATH"
else
  echo "❌ Build finished but $AAB_PATH was not found"
  exit 1
fi
