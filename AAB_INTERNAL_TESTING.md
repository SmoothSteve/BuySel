# Build a signed `.aab` for Google Play internal testing

This repository already contains an Android Trusted Web Activity project under `app/`.

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

Use the project helper script (supports either signing method above):

```bash
./scripts/build-aab-for-play.sh
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

- **"Missing Android signing credentials"**
  - Ensure either `keystore.properties` exists in repo root, or all 4 `ANDROID_*` variables are exported.
- **"Detected Java XX"**
  - Switch to JDK 17 or 21 and retry.
- **Build succeeds but Play rejects upload**
  - Confirm `applicationId` and signing key are consistent with previous Play uploads.
