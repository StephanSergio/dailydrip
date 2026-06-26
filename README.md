# DailyDrip

A mobile-first web app that picks a matching daily outfit in seconds. It styles
two complete outfits (primary + backup) from your own wardrobe using Claude,
tailored to one specific user's build, skin tone, and basics-with-one-accent
philosophy.

- **Frontend:** React + Vite (static, deployed to GitHub Pages)
- **Backend:** Firebase Firestore (free Spark plan — no Storage, no billing;
  photos are stored inline in documents)
- **AI:** Anthropic API (`claude-sonnet-4-6`), called from the browser
- **CI/CD:** GitHub Actions → GitHub Pages

---

## ⚠️ Security warning — read before sharing the URL

This app is built for a **single user** and ships with **wide-open backend rules
and a browser-exposed AI key**. Lock these down before sharing the deployed URL
with anyone.

1. **Anthropic API key is visible in the deployed bundle.**
   `VITE_ANTHROPIC_API_KEY` is compiled into the public JavaScript at build
   time. It is **not** in the git repo (it lives only in `.env`, which is
   gitignored, and in GitHub Actions secrets) — but anyone who opens the
   **deployed site** can read it from the network tab. GitHub Secrets hide it
   from the *source*, not from the *shipped app*.
   - **Mitigate now:** set a low monthly spend limit on the key in the
     [Anthropic Console](https://console.anthropic.com), and rotate it if it
     leaks.
   - **Fix properly later:** move the Anthropic call behind a small server-side
     proxy (e.g. a Cloudflare Worker or Firebase Cloud Function) that holds the
     key, and point the frontend at the proxy instead of calling Anthropic
     directly. See `src/lib/anthropic.ts`.

2. **Firestore rules are open** (read/write to all). Anyone with the project
   config could read or write your data. Restrict before sharing — see
   [Hardening](#hardening).

---

## 1. Firebase setup

1. Go to the [Firebase Console](https://console.firebase.google.com) and create
   a project (or use an existing one).
2. **Enable Firestore:** Build → Firestore Database → Create database → start in
   **test mode** (open rules; harden later). This is the only Firebase service
   you need — **Storage is not used** (and is not required), so you can stay on
   the free Spark plan with no billing.
3. **Get your web config:** Project Settings (gear icon) → General → scroll to
   *Your apps* → if there's no web app, click the `</>` (Web) icon to register
   one. Copy these values:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET` (optional — unused, safe to leave blank)
   - `appId` → `VITE_FIREBASE_APP_ID`
4. **Anthropic key:** create one at the
   [Anthropic Console](https://console.anthropic.com) → `VITE_ANTHROPIC_API_KEY`.

### Open rules (default, single-user)

Firestore rules (`firestore.rules`):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if true; }
  }
}
```

---

## 2. Fill in `.env`

Copy the example and fill in the values from step 1:

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_APP_ID=...
VITE_ANTHROPIC_API_KEY=...
```

`.env` is gitignored — never commit it.

---

## 3. GitHub secrets for CI/CD

The deploy workflow needs the same variables as repository secrets so they're
injected at build time.

Repo → **Settings → Secrets and variables → Actions → New repository secret**,
add each of:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_APP_ID`
- `VITE_ANTHROPIC_API_KEY`

Then enable Pages: repo → **Settings → Pages → Source: Deploy from a branch →
Branch: `gh-pages` / root**. The first push to `main` runs the workflow, which
builds and publishes to the `gh-pages` branch. The site URL will be
`https://<your-username>.github.io/dailydrip/`.

---

## 4. Local development

```bash
npm install
npm run dev
```

Open the printed local URL. Production build / preview:

```bash
npm run build
npm run preview
```

---

## Hardening

Before sharing the app with anyone other than yourself:

- **Lock the Anthropic key** (spend limit + proxy) — see the
  [security warning](#-security-warning--read-before-sharing-the-url) above.
- **Restrict Firestore rules** — add Firebase Auth and scope rules to the
  authenticated user, or restrict by an allowlist. The current `if true` rules
  let anyone read and write.

---

## How it works

- **Wardrobe** (`/wardrobe`): add items with group → category → subcategory,
  colors, and style tags. A photo is **optional** and can come from an
  **upload** (validated as an image, < 5MB, resized to 800px longest side and
  stored inline in the Firestore document as a data URL) or a pasted **image
  URL** (stored as a direct link). The AI stylist only uses item *text* (name,
  category, colors, style), so **text-only items work fully** — a missing photo
  just shows a neutral placeholder.
- **Today** (`/`): pick weather + occasion + mood (or flip Sport mode), and
  Claude returns two complete outfits with explanations and a style note. Only a
  lean wardrobe payload (`id, name, category, subcategory, colors, style`) is
  sent — never photos. "Wearing this" records the primary outfit to history.
- **History** (`/history`): the last 7 saved outfits, newest first.
