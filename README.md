# DailyDrip

A mobile-first web app that picks a matching daily outfit in seconds. It styles
two complete outfits (primary + backup) from your own wardrobe using Claude,
tailored to one specific user's build, skin tone, and basics-with-one-accent
philosophy.

- **Frontend:** React + Vite (static, deployed to GitHub Pages)
- **Backend:** Firebase Firestore (free Spark plan — no Storage, no billing;
  photos are stored inline in documents)
- **AI:** Anthropic API (`claude-sonnet-4-6`), called via a Cloudflare Worker
  proxy that holds the key (see `worker/`)
- **CI/CD:** GitHub Actions → GitHub Pages

---

## ⚠️ Security warning — read before sharing the URL

This app is built for a **single user**. The Anthropic key is kept server-side in
the Worker (it is **not** in the bundle), but two things still need attention:

1. **The Worker is a public endpoint.** Because the site is public, the proxy
   URL is too — anyone who finds it can call it and spend your Anthropic credits.
   The Worker caps the model and `max_tokens` to limit cost per call and
   restricts CORS to the app's origins, but the real backstop is a **spend limit
   on the key** in the [Anthropic Console](https://console.anthropic.com). Set one.

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
   [Anthropic Console](https://console.anthropic.com). You'll give it to the
   Worker (next section), not the frontend.

## 1b. Deploy the Anthropic Worker proxy

The Anthropic key lives in a Cloudflare Worker so it never ships in the public
site. From the `worker/` folder:

```bash
cd worker
npx wrangler login                       # opens browser (free Cloudflare account)
npx wrangler secret put ANTHROPIC_API_KEY   # paste your Anthropic key when prompted
npx wrangler deploy
```

`wrangler deploy` prints the Worker URL, e.g.
`https://dailydrip-anthropic.<your-subdomain>.workers.dev`. That URL is your
`VITE_ANTHROPIC_PROXY_URL`. If your deployed site origin isn't
`https://stephansergio.github.io`, also update `ALLOWED_ORIGINS` in
`worker/src/index.js` and redeploy.

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
VITE_ANTHROPIC_PROXY_URL=https://dailydrip-anthropic.<your-subdomain>.workers.dev
```

`VITE_ANTHROPIC_PROXY_URL` is the Worker URL from step 1b (not the Anthropic key
— the key lives only in the Worker). `.env` is gitignored — never commit it.

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
- `VITE_ANTHROPIC_PROXY_URL` (the Worker URL from step 1b)

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
