# Deploy: MongoDB + GitHub + Vercel

Follow these steps to get a live link with cloud storage.

---

## 1. MongoDB Atlas (free database)

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create an account.
2. Create a **free M0 cluster**.
3. **Database Access** → Add user (username + password). Remember the password.
4. **Network Access** → Add IP → **Allow access from anywhere** (`0.0.0.0/0`) so Vercel can connect.
5. **Database** → **Connect** → **Drivers** → copy the connection string.
6. Replace `<password>` with your user password and keep it like:
   ```
   mongodb+srv://myuser:MyP%40ssword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   (URL-encode special characters in the password, e.g. `@` → `%40`)

---

## 2. Push code to GitHub

In PowerShell, from your project folder:

```powershell
cd "c:\Users\Npci onboarding\Desktop\Linkedin"

git init
git add .
git commit -m "LinkedIn outreach dashboard with MongoDB API"

# Create a new repo on github.com (empty, no README), then:
git remote add origin https://github.com/YOUR_USERNAME/linkedin-outreach.git
git branch -M main
git push -u origin main
```

---

## 3. Deploy on Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in with **GitHub**.
2. **Add New Project** → import your `linkedin-outreach` repo.
3. Vercel should detect settings from `vercel.json`:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables** (required):

   | Name | Value |
   |------|--------|
   | `MONGODB_URI` | Your Atlas connection string |
   | `JWT_SECRET` | A long random string (32+ chars), e.g. run `openssl rand -hex 32` |

5. Click **Deploy**.

Your app will be live at something like:
`https://linkedin-outreach-xxxxx.vercel.app`

---

## 4. Local development with API

The frontend talks to `/api/*` on the same domain. For local dev with MongoDB:

1. Copy env file:
   ```powershell
   copy .env.example .env.local
   ```
2. Fill in `MONGODB_URI` and `JWT_SECRET` in `.env.local`.
3. Install Vercel CLI and run:
   ```powershell
   npm install
   npm i -g vercel
   vercel dev
   ```
   Open the URL shown (usually `http://localhost:3000`).

`npm run dev` alone only runs the UI without the API — use `vercel dev` for full stack.

---

## Architecture

```
Browser (React on Vercel)
    ↓  /api/login
    ↓  /api/user-data
Vercel Serverless Functions (api/)
    ↓
MongoDB Atlas (database: linkedin_outreach, collection: users)
```

Each user is keyed by **mobile number**. One document per user stores profile, connections, and outreach status.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Login fails / 500 error | Check `MONGODB_URI` and `JWT_SECRET` in Vercel env vars |
| MongoDB connection timeout | Allow `0.0.0.0/0` in Atlas Network Access |
| Blank page after deploy | Check Vercel build logs; ensure `dist` is output |
| Data not saving | Open browser DevTools → Network; check `/api/user-data` PUT |
| Login "Not Found" | Open `YOUR-URL/api/health` — must show JSON, not 404 |

---

## How accounts work

- **No restrictions** — anyone can enter any 10-digit mobile number and use the app
- **No password or OTP** — the number is only an ID to load/save that person's data
- **MongoDB** stores one record per mobile: connections, messages, outreach status
- Share the Vercel link freely; each person uses their own number
