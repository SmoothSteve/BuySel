# Build a signed `.aab` for Google Play internal testing

This repository already contains an Android Trusted Web Activity project under `app/`.

## 0) Install prerequisites

You need both:

- Java JDK 17 or 21
- Gradle available on `PATH` (`gradle -v`)

Windows install examples (pick one package manager):

```powershell
# Chocolatey
choco install temurin17jdk gradle -y

# Scoop
scoop install openjdk17 gradle

# Winget (if available in your environment)
winget search gradle
```

## 1) Use Java 17 or Java 21

This Gradle/Android plugin setup should be built with JDK 17 or 21.

Check current Java version:

```bash
java -version
```

If you see a newer major version (for example Java 25), set `JAVA_HOME` to JDK 17/21 before building.

## 2) Create an upload keystore (one-time)

> Keep this file safe and backed up. Use the same key for all future updates.

```bash
keytool -genkeypair \
  -v \
  -keystore ~/buysel-upload-key.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

## 3) Add signing credentials

Choose one of the following methods.

### Option A: `keystore.properties` (recommended)

Create `keystore.properties` in the repo root:

```properties
storeFile=/home/<you>/buysel-upload-key.jks
storePassword=<your_store_password>
keyAlias=upload
keyPassword=<your_key_password>
```

This file is already ignored by git.

### Option B: environment variables

```bash
export ANDROID_STORE_FILE=/home/<you>/buysel-upload-key.jks
export ANDROID_STORE_PASSWORD=<your_store_password>
export ANDROID_KEY_ALIAS=upload
export ANDROID_KEY_PASSWORD=<your_key_password>
```

## 4) Build the release app bundle (`.aab`)

Use a helper script based on your shell:

```bash
# Bash (macOS/Linux/Git Bash)
./scripts/build-aab-for-play.sh
```

```powershell
# PowerShell (Windows)
.\scripts\build-aab-for-play.ps1
```

or run Gradle directly:

```bash
gradle :app:bundleRelease
```

## 5) Confirm output

Signed bundle output path:

```text
app/build/outputs/bundle/release/app-release.aab
```


## Exact commands (copy/paste)

### Bash (macOS/Linux/Git Bash)

> Run these from the repo root (`/workspace/BuySel`).

```bash
keytool -genkeypair -v -keystore "$HOME/buysel-upload-key.jks" -alias upload -keyalg RSA -keysize 2048 -validity 10000

cat > keystore.properties <<'EOF'
storeFile=/home/<your-user>/buysel-upload-key.jks
storePassword=<store-password>
keyAlias=upload
keyPassword=<key-password>
EOF

./scripts/build-aab-for-play.sh
ls -lh app/build/outputs/bundle/release/app-release.aab
```

### PowerShell (Windows)

> Use this if your prompt starts with `PS ...>` (like your screenshot/log output).

```powershell
# from repo root, e.g. C:\GitHub\BuySel
gradle -v
keytool -genkeypair -v -keystore "$HOME\buysel-upload-key.jks" -alias upload -keyalg RSA -keysize 2048 -validity 10000

@"
storeFile=$HOME\buysel-upload-key.jks
storePassword=<store-password>
keyAlias=upload
keyPassword=<key-password>
"@ | Set-Content -Path keystore.properties

# Option 1: use PowerShell helper (if present)
if (Test-Path .\scripts\build-aab-for-play.ps1) {
  & .\scripts\build-aab-for-play.ps1
} else {
  Write-Host "Helper script missing; run 'git pull' and use direct Gradle commands below."
}

# Option 2 (always works): set env vars directly for this PowerShell session
$env:ANDROID_STORE_FILE = "$HOME\buysel-upload-key.jks"
$env:ANDROID_STORE_PASSWORD = "<store-password>"
$env:ANDROID_KEY_ALIAS = "upload"
$env:ANDROID_KEY_PASSWORD = "<key-password>"
gradle :app:bundleRelease

Get-Item .\app\build\outputs\bundle\release\app-release.aab
```

## 6) Upload to Google Play internal testing

1. Open Google Play Console.
2. Select your app.
3. Go to **Testing** → **Internal testing**.
4. Create a release and upload `app-release.aab`.
5. Add testers (email list or Google Group).
6. Roll out the release.
7. Share the generated opt-in link with testers.

## 7) Verify install as a tester

On a tester device:

1. Open the internal testing opt-in link.
2. Accept the invite with the tester Google account.
3. Install/update from Play Store.
4. Confirm the installed version matches the uploaded release.

## Troubleshooting

- **".\scripts\build-aab-for-play.ps1 is not recognized"**
  - Verify you are in repo root (`Get-Location`) and the file exists (`Test-Path .\scripts\build-aab-for-play.ps1`).
  - If missing, run `git pull` (or sync your fork/branch), then retry.
  - You can always use the direct PowerShell env-var + `gradle :app:bundleRelease` commands shown above.
- **"Missing Android signing credentials"**
  - Ensure either `keystore.properties` exists in repo root, or all 4 `ANDROID_*` variables are exported.
- **"Detected Java XX"**
  - Switch to JDK 17 or 21 and retry.
- **"gradle" is not recognized**
  - Install Gradle, restart terminal, and verify with `gradle -v`.
  - Windows options: `choco install gradle -y`, `scoop install gradle`, or run `winget search gradle` to find a valid package ID in your sources.
- **"Could not find method jcenter()"**
  - This means your checkout has older Gradle repo config that is incompatible with newer Gradle.
  - Pull latest changes (which replace `jcenter()` with `mavenCentral()`), then run again.
- **Build succeeds but Play rejects upload**
  - Confirm `applicationId` and signing key are consistent with previous Play uploads.
