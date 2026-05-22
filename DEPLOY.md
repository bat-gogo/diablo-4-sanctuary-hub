# Sanctuary Hub — deployment guide

Two deployments in one project:

1. **`apps/web`** → Vercel (Next.js 16 backend + web client).
2. **`apps/mobile`** → EAS Build (Android `.apk` via expo.dev).

The mobile build embeds the Vercel URL at build time, so the web app
must be deployed first.

---

## Part 1 — Web app on Vercel

### 1.1 Vercel project setup

1. Sign in to <https://vercel.com> with the same GitHub account that owns
   the repo (`bat-gogo`).
2. Click **Add New… → Project** → import
   `bat-gogo/diablo-4-sanctuary-hub`.
3. Configure the project:

   | Setting              | Value                |
   | -------------------- | -------------------- |
   | Framework Preset     | `Next.js` (detected) |
   | **Root Directory**   | `apps/web`           |
   | Install Command      | *leave default*      |
   | Build Command        | *leave default*      |
   | Output Directory     | *leave default*      |

   `apps/web/vercel.json` overrides the install command to
   `cd ../.. && npm install` so the monorepo workspaces resolve. You
   don't need to touch any other build settings.

### 1.2 Environment variables

In **Project Settings → Environment Variables** add the three required
secrets, applied to all three environments (Production / Preview /
Development). Copy the values straight from `apps/web/.env.local`:

| Key                          | Value                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| `DATABASE_URL`               | the full `postgresql://…neon.tech/neondb?…channel_binding=require` string             |
| `JWT_SECRET`                 | the 64-char hex string                                                                 |
| `NEXT_PUBLIC_R2_PUBLIC_URL`  | `https://pub-2d890d5d6d8d4694973387ba2949550d.r2.dev`                                  |

The other entries in `.env.local` (`NEXTAUTH_*`, `R2_ACCOUNT_ID`, etc.)
are not consumed by any runtime code and can be left out.

### 1.3 Deploy

Click **Deploy**. The first build takes ~3-5 min (installs ~915 packages,
compiles Next, prerenders the static pages). Vercel will then assign a
URL like:

> `https://diablo-4-sanctuary-hub-bat-gogo.vercel.app`

Save that URL — the Expo APK build needs it next.

### 1.4 Smoke test

Once green:

```bash
PROD_URL=https://your-vercel-url.vercel.app
curl -s "$PROD_URL/api/builds/featured" | head -c 200
curl -s "$PROD_URL/api/events"          | head -c 200
```

Both should return JSON. If `/api/builds/featured` returns 500, double-check
that `DATABASE_URL` and `JWT_SECRET` are saved against the Production
environment in Vercel.

---

## Part 2 — Android APK via EAS Build

### 2.1 Wire the Vercel URL into EAS

Edit `apps/mobile/eas.json` and replace the placeholder LAN IP with
your Vercel URL:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": {
        "EXPO_PUBLIC_API_URL":      "https://your-vercel-url.vercel.app",
        "EXPO_PUBLIC_R2_PUBLIC_URL":"https://pub-2d890d5d6d8d4694973387ba2949550d.r2.dev"
      }
    }
  }
}
```

Commit + push.

### 2.2 Build the APK

Requires a free <https://expo.dev> account.

```bash
# one-time
npm install -g eas-cli
eas login

cd apps/mobile

# one-time per project — pairs this repo with an EAS project id
eas init

# triggers the cloud build (~10-15 min on Expo's infra)
eas build --platform android --profile preview
```

When the build finishes, EAS prints the APK download URL and a QR code.
Scan with Android → install → open → use the bundled **Admin demo /
User demo** buttons.

### 2.3 Local APK (no Expo cloud — needs Docker)

```bash
cd apps/mobile
eas build --platform android --profile preview --local
```

The `.apk` lands in `apps/mobile/build-<timestamp>.apk`.

---

## Demo accounts (seeded)

| Email                       | Password         | Role  |
| --------------------------- | ---------------- | ----- |
| `admin@sanctuaryhub.gg`     | `AdminPass123!`  | admin |
| `user@test.com`             | `Password123!`   | user  |

Both buttons are baked into the web `/login` page and the mobile login
screen, so the grader can sign in without typing.

---

## Troubleshooting

### "Cannot find module '@sanctuary-hub/db'" during Vercel build

The custom `installCommand` in `apps/web/vercel.json` is the fix. If
the build still fails to resolve workspace packages, double-check:

- Vercel **Root Directory** is `apps/web` (not the repo root)
- `apps/web/vercel.json` is committed and shows the
  `"installCommand": "cd ../.. && npm install"` line
- The Vercel build log starts with `Running "install command: cd ../.. && npm install"`

### Neon connection times out

The neon-http driver uses fetch under the hood, no pooling needed. If
queries time out on Vercel, check that the connection string in
`DATABASE_URL` ends with `?sslmode=require&channel_binding=require`.

### Expo build fails on `expo-router/entry`

Make sure `"main": "expo-router/entry"` is set in `apps/mobile/package.json`
and the `app/` directory exists at the project root. The `App.tsx` /
`index.ts` from the original blank template must be deleted (they were
removed in commit 5a7ab12).
