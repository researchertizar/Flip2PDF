# Flip2PDF — Vercel Proxy Edition

Convert online flipbooks to PDF with zero CORS restrictions, using your own Vercel serverless proxy.

---

## Deploy in 3 Steps

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "flip2pdf proxy"
gh repo create flip2pdf-proxy --public --push
```

### 2. Import on Vercel

- Go to https://vercel.com/new
- Import your GitHub repo
- Click **Deploy** (zero config needed — `vercel.json` handles everything)

### 3. Set your proxy URL in the app

After deployment, copy your Vercel URL (e.g. `https://flip2pdf-proxy.vercel.app`) and enter:

```
https://flip2pdf-proxy.vercel.app/api/proxy?url=
```

into the **Proxy Configuration** field in the app, then click **Ping Proxy** to verify.

---

## Local Dev

```bash
npm install
npx vercel dev
# App runs at http://localhost:3000
# Proxy runs at http://localhost:3000/api/proxy?url=<encoded-url>
```

---

## File Structure

```
flip2pdf-vercel/
├── api/
│   └── proxy.js        ← Vercel Edge Function (the proxy)
├── index.html          ← Full app frontend
├── vercel.json         ← Vercel config (edge runtime, CORS headers)
├── package.json
└── README.md
```

---

## How It Works

```
Browser → /api/proxy?url=<encoded-flipbook-jpg> → Vercel Edge → Flipbook server
```

The Edge Function:

- Decodes the target URL
- Blocks private/local IPs (SSRF guard)
- Fetches the image server-side (no CORS restriction)
- Streams it back to your browser with `Access-Control-Allow-Origin: *`
- Caches responses for 24h (CDN layer)

---

## Limits (Vercel Free Tier)

| Resource                  | Limit               |
| ------------------------- | ------------------- |
| Edge Function invocations | 1,000,000 / month   |
| Execution time            | 30s max per request |
| Bandwidth                 | 100 GB / month      |

More than enough for personal use.

---

## Security Notes

- The proxy blocks `localhost`, `127.x`, `10.x`, `192.168.x`, `172.16-31.x` (no SSRF)
- Only `http://` and `https://` protocols allowed
- For production: restrict `Access-Control-Allow-Origin` to your actual domain

---

Built by Ahayas — Flip2PDF v4.0
