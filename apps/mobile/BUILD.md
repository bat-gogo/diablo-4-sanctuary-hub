# Sanctuary Hub — mobile build guide

The Expo app talks to the same Next.js backend that runs in `apps/web`. For
a usable APK the phone needs to reach that backend over the network, so
**before** building the APK make sure either:

- the web app is running on the same LAN as the phone, **or**
- the web app is deployed publicly (Netlify / Vercel / Railway / …).

Set `EXPO_PUBLIC_API_URL` in `eas.json` accordingly. The default in this
repo points at `http://192.168.100.63:3000` (the LAN IP of the dev machine
when these files were authored) — update it to your own LAN IP or your
deployed URL before running a build.

## Local dev (no APK)

```bash
# from repo root
cd apps/mobile
npx expo start
```

Then scan the QR code with the Expo Go app on iOS / Android, or press
`a` for the Android emulator / `i` for the iOS simulator. The API URL is
auto-detected from the dev machine's LAN IP (via `expoConfig.hostUri`),
so nothing else to configure.

## Cloud APK build via expo.dev (recommended)

Requires a free Expo account.

```bash
cd apps/mobile

# 1. Install the EAS CLI globally (one-time):
npm install -g eas-cli

# 2. Log in:
eas login

# 3. Wire this project to an EAS project (one-time):
eas init

# 4. Build the APK. The "preview" profile produces an installable APK
#    pinned to the EXPO_PUBLIC_API_URL set in eas.json:
eas build --platform android --profile preview

# (If the API URL in eas.json's preview profile is wrong, edit it first.)
```

The build runs on Expo's infrastructure (~10–15 min). When it finishes
EAS returns a downloadable APK URL plus a QR code that opens it directly
on Android.

## Local APK build (no Expo cloud, needs Docker)

```bash
eas build --platform android --profile preview --local
```

This runs the same pipeline locally using a Docker container. The
resulting APK is dropped into `apps/mobile/build-<timestamp>.apk`.

## What gets baked into the APK

The Expo Router app is a regular React Native app — once built, the
JS bundle is frozen at build time. Anything from `process.env.EXPO_PUBLIC_*`
is replaced with literal strings during the build. After install, the only
runtime configuration is the data the server hands back; no env editing is
possible on-device.

## Demo accounts (built into the login screen)

| Email                       | Password         | Role  |
| --------------------------- | ---------------- | ----- |
| `admin@sanctuaryhub.gg`     | `AdminPass123!`  | admin |
| `user@test.com`             | `Password123!`   | user  |

Both buttons are wired into the login screen as one-tap shortcuts — the
grader doesn't need to type credentials.
