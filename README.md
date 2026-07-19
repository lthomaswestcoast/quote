# Olive Grove Quote Generator

Internal quote tool for Olive Grove Events. Enter item quantities and delivery,
get an itemized quote with refundable deposit, copy to send.

## Run locally
```bash
npm install
npm run dev
```
Opens at http://localhost:5173

## Deploy (any phone via URL)

### Vercel (recommended — auto-deploys from GitHub)
1. Push this folder to a GitHub repo.
2. Go to vercel.com, sign in with GitHub, click "Add New → Project".
3. Select the repo. Vercel auto-detects Vite — no config needed.
4. Click Deploy. You get a live URL in ~1 minute.
5. On your phone, open the URL → browser menu → "Add to Home Screen".

### Netlify Drop (no GitHub needed)
1. Run `npm install && npm run build` locally.
2. Go to app.netlify.com/drop and drag in the `dist` folder.
3. Get an instant URL.

## Pricing reference (edit in src/QuoteGenerator.jsx)
- Chairs $4, Tables $9, Tablecloths $5, Napkins $1, Chargers $2, Signs $45
- Cutlery $1/set, or $75 flat at 95+ sets
- Delivery: local $100 flat, out-of-town $2/km round trip
- Refundable deposit: Chairs $2/ea, Tables $5/ea
