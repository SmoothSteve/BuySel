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

## 3) Add signing credentials (local only)

Create `keystore.properties` in the repo root:

```properties
storeFile=/home/<you>/buysel-upload-key.jks
storePassword=<your_store_password>
keyAlias=upload
keyPassword=<your_key_password>
```

This file is already ignored by git.

## 4) Build the app bundle

```bash
./scripts/build-aab-for-play.sh
```

or directly:

```bash
gradle :app:bundleRelease
```

## 5) Find the output

Signed bundle output path:

```text
app/build/outputs/bundle/release/app-release.aab
```

## 6) Upload to Google Play internal testing

1. Open Google Play Console.
2. Go to your app → **Testing** → **Internal testing**.
3. Create a release and upload `app-release.aab`.
4. Add testers and roll out the release.

## Optional: use environment variables instead of `keystore.properties`

You can export these instead:

```bash
export ANDROID_STORE_FILE=/home/<you>/buysel-upload-key.jks
export ANDROID_STORE_PASSWORD=<your_store_password>
export ANDROID_KEY_ALIAS=upload
export ANDROID_KEY_PASSWORD=<your_key_password>
```

Then run:

```bash
gradle :app:bundleRelease
```
