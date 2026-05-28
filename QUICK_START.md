# 🚀 MIMI Agency — Quick Start Guide

## Current Status
✅ Source code ready  
✅ Environment configured  
⏳ **Database connection needed**

---

## 3-Minute Setup

### 1️⃣ Get PostgreSQL Connection String

**Choose one option:**

#### Option A: Neon (FREE, Recommended ⭐)
1. Go to https://console.neon.tech
2. Sign up (GitHub/email)
3. Create project → get connection string
4. Copy string → use in step 2

#### Option B: Check Vercel Postgres
1. Go to https://vercel.com/dashboard → mimi-premium-fvvk
2. Click **Storage** → check if Postgres exists
3. If yes, copy CONNECTION_STRING
4. If no, create new → copy string → use in step 2

#### Option C: Use External Database
- Railway: https://railway.app (free tier)
- AWS RDS
- DigitalOcean
- Any PostgreSQL provider

---

### 2️⃣ Update .env File

Edit `.env` and replace this line:
```bash
DATABASE_URL="PASTE_YOUR_CONNECTION_STRING_HERE"
```

Example (Neon):
```bash
DATABASE_URL="postgresql://user:abc123@ep-cool-name.neon.tech/neondb?sslmode=require"
```

**Note:** The connection string format must be:
```
postgresql://username:password@host:port/database?sslmode=require
```

---

### 3️⃣ Run Setup Script

```bash
cd ~/mimi-agency-v2

# Generate Prisma client
npx prisma generate

# Apply database schema
npx prisma db push --skip-generate

# Seed admin account + demo data
npm run db:seed
```

**Output should show:**
```
✅ Database seeded.
   ADMIN  → admin@mimi.agency / mimi2024
   CLIENT → aesthetic@mimi.dev / client2024
   CLIENT → fitness@mimi.dev   / client2024
   ...
```

---

### 4️⃣ Test Locally

```bash
npm run dev
```

Open http://localhost:3000/auth/login

Login with:
- **Email:** admin@mimi.agency
- **Password:** mimi2024

---

### 5️⃣ Deploy to Vercel

1. Go to https://vercel.com/dashboard/mimi-premium-fvvk
2. Settings → Environment Variables
3. Add your DATABASE_URL:
   - **Name:** DATABASE_URL
   - **Value:** (your connection string)
   - **Environments:** ✓ Production ✓ Preview ✓ Development
4. Click Save → Redeploy

---

## Troubleshooting

### "Error: P1000 — authentication failed"
- Check DATABASE_URL spelling
- Verify username/password are correct
- For Neon: ensure `?sslmode=require` is at the end

### "Error: read ECONNREFUSED"
- Database server is down
- Or DATABASE_URL is not reachable from your network

### "No users found" on login
- Run `npm run db:seed` to create admin account

### "prisma error: Unknown generator"
- Run `npx prisma generate`

---

## Database Providers Comparison

| Provider | Cost | Speed | Setup | Notes |
|----------|------|-------|-------|-------|
| **Neon** | Free | ⚡⚡⚡ | 1 min | Recommended for dev |
| Vercel Postgres | $10/mo | ⚡⚡⚡ | 5 min | Integrated with Vercel |
| Railway | Free tier | ⚡⚡ | 5 min | Good alternative |
| AWS RDS | Varies | ⚡⚡ | 15 min | Enterprise-grade |

---

## Files You Need to Know About

- `.env` — Your local database connection (⚠️ NEVER commit this!)
- `prisma/schema.prisma` — Database structure
- `prisma/seed.ts` — Demo data generator
- `src/lib/auth.ts` — NextAuth configuration

---

## Admin Dashboard Access

Once logged in as admin, visit:
- http://localhost:3000/admin → overview
- http://localhost:3000/admin/clients → manage clients
- http://localhost:3000/admin/campaigns → manage campaigns
- http://localhost:3000/admin/metrics → add metrics

---

## Demo Client Accounts

After running seed, these accounts are also available:

```
aesthetic@mimi.dev    / client2024
fitness@mimi.dev      / client2024
realty@mimi.dev       / client2024
cafe@mimi.dev         / client2024
```

Each has:
- ✅ Sample campaigns
- ✅ 60 days of metrics
- ✅ Lead pipeline data
- ✅ Performance data (ROMI, CAC, etc.)

---

## Next Steps

1. ✅ Get DATABASE_URL (steps 1-2 above)
2. ✅ Run setup commands (step 3)
3. ✅ Test locally (step 4)
4. ✅ Deploy to Vercel (step 5)
5. 🎉 Done!

---

**Questions?** Check VERCEL_DEPLOYMENT.md or DATABASE_SETUP.md
