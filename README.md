# HYRE — AI Job Agent

Email-based job application agent. Finds matched roles, generates tailored emails via Claude, sends via Gmail.

## Stack

- React + Vite (frontend)
- Vercel serverless function (`/api/generate.js`) — Claude API proxy
- Claude claude-sonnet-4-5 for email generation

## Local dev

```bash
npm install
```

Create `.env` at root:
```
ANTHROPIC_API_KEY=sk-ant-...
```

```bash
npm run dev
```

## Deploy to Vercel

1. Push to GitHub (`vishhhh999`)
2. Import repo in Vercel dashboard
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Framework preset: **Vite**
5. Build command: `npm run build`
6. Output dir: `dist`

To use a custom domain (e.g. `hyre.visheshmahendru.com`):
- Add CNAME record pointing to `cname.vercel-dns.com`
- Add domain in Vercel project → Settings → Domains

## Project structure

```
hyre/
├── api/
│   └── generate.js        # Vercel serverless — Claude proxy
├── src/
│   ├── lib/
│   │   ├── tokens.js      # Design tokens (single source of truth)
│   │   ├── data.js        # Jobs, profile, pipeline seed data
│   │   └── api.js         # Email generation calls → /api/generate
│   ├── components/
│   │   ├── Primitives.jsx # Shared atoms (Eyebrow, MatchScore, Tag, etc.)
│   │   ├── ReviewDeck.jsx # Full-viewport apply flow
│   │   ├── Discover.jsx   # Job ledger + selection
│   │   ├── Pipeline.jsx   # Kanban + follow-up engine
│   │   └── Profile.jsx    # Applicant data editor
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```
