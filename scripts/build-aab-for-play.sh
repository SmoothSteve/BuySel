#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v gradle >/dev/null 2>&1; then
  echo "❌ gradle is not installed or not in PATH"
  echo "   Install Gradle and try again (e.g. 'brew install gradle' or 'sdk install gradle')."
  exit 1
fi

if ! command -v java >/dev/null 2>&1; then
  echo "❌ java is not installed or not in PATH"
  exit 1
fi

has_android_sdk_location() {
  if [[ -n "${ANDROID_HOME:-}" && -d "${ANDROID_HOME}" ]]; then
    return 0
  fi

  if [[ -n "${ANDROID_SDK_ROOT:-}" && -d "${ANDROID_SDK_ROOT}" ]]; then
    return 0
  fi

  if [[ -f "local.properties" ]] && grep -q '^sdk\.dir=' local.properties; then
    return 0
  fi

  return 1
}

if ! has_android_sdk_location; then
  cat <<'MSG'
❌ Android SDK location not found.
Define one of the following, then retry:

1) Environment variable:
   ANDROID_HOME=/absolute/path/to/Android/Sdk
   (or ANDROID_SDK_ROOT)

2) local.properties in repo root:
   sdk.dir=/absolute/path/to/Android/Sdk
MSG
  exit 1
fi

JAVA_MAJOR="$(java -version 2>&1 | awk -F '[\".]' '/version/ {print $2; exit}')"
if [[ -n "${JAVA_MAJOR}" && "${JAVA_MAJOR}" -gt 21 ]]; then
  echo "❌ Detected Java ${JAVA_MAJOR}. This project builds reliably with Java 17 or 21."
  echo "   Set JAVA_HOME to a JDK 17/21 installation, then try again."
  exit 1
fi

load_signing_from_properties_file() {
  if [[ ! -f "keystore.properties" ]]; then
    return 1
  fi

  # shellcheck disable=SC1091
  source "keystore.properties"

  export ANDROID_STORE_FILE="${ANDROID_STORE_FILE:-${storeFile:-}}"
  export ANDROID_STORE_PASSWORD="${ANDROID_STORE_PASSWORD:-${storePassword:-}}"
  export ANDROID_KEY_ALIAS="${ANDROID_KEY_ALIAS:-${keyAlias:-}}"
  export ANDROID_KEY_PASSWORD="${ANDROID_KEY_PASSWORD:-${keyPassword:-}}"

  return 0
}

has_complete_signing_env() {
  [[ -n "${ANDROID_STORE_FILE:-}" ]] &&
  [[ -n "${ANDROID_STORE_PASSWORD:-}" ]] &&
  [[ -n "${ANDROID_KEY_ALIAS:-}" ]] &&
  [[ -n "${ANDROID_KEY_PASSWORD:-}" ]]
}

if ! has_complete_signing_env; then
  load_signing_from_properties_file || true
fi

if ! has_complete_signing_env; then
  cat <<'MSG'
❌ Missing Android signing credentials.
Provide signing credentials with either:

1) keystore.properties in /workspace/BuySel:
   storeFile=/absolute/path/to/upload-keystore.jks
   storePassword=your_store_password
   keyAlias=upload
   keyPassword=your_key_password

OR

2) Environment variables:
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
