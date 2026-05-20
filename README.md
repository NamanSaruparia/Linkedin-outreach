# LinkedIn Outreach Dashboard

Personal dashboard to import LinkedIn connections, generate personalized outreach messages, and track who you've contacted and who replied.

**Live stack:** React → Vercel API → MongoDB Atlas

## Features

- **Open access** — Anyone enters their mobile number; no password or approval. Progress is saved per number in MongoDB
- **Import** — LinkedIn `Connections.csv`
- **Message setup** — Auto-generate or write your own template with placeholders
- **Connections** — Personalized messages, copy, status tracking
- **Analytics** — Outreach progress and reply rates

## Quick start (local)

```bash
npm install
copy .env.example .env.local   # add MONGODB_URI + JWT_SECRET
vercel dev                      # full app + API at localhost:3000
```

## Deploy to production

See **[DEPLOY.md](./DEPLOY.md)** for step-by-step:

1. MongoDB Atlas setup  
2. Push to GitHub  
3. Deploy on Vercel with environment variables  

## Environment variables

| Variable | Where | Description |
|----------|--------|-------------|
| `MONGODB_URI` | Vercel + `.env.local` | MongoDB Atlas connection string |
| `JWT_SECRET` | Vercel + `.env.local` | Secret for login tokens (32+ chars) |

## LinkedIn export

Settings & Privacy → Data privacy → Get a copy of your data → **Connections** → extract `Connections.csv`.
