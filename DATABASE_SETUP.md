# 🗄️ Database Setup Guide — Neon (Free Tier)

## Step 1: Create Free Neon Account
1. Go to https://console.neon.tech
2. Sign up (GitHub or email)
3. Create new project "mimi-agency"

## Step 2: Get Connection String
1. In Neon dashboard → Your project
2. Click "Connect" (top right)
3. Select "Nodejs"
4. Copy the connection string (looks like):
   ```
   postgresql://user:password@host.neon.tech/dbname?sslmode=require
   ```

## Step 3: Add to Vercel
1. Go to https://vercel.com/dashboard
2. Select mimi-premium-fvvk project
3. Settings → Environment Variables
4. Add:
   - Name: `DATABASE_URL`
   - Value: (paste the connection string from Neon)
   - Environments: Production, Preview, Development
5. Click "Save"

## Step 4: Set Up Locally
1. Copy the Neon connection string
2. Run setup script:
   ```bash
   cd ~/mimi-agency-v2
   ./setup-local-db.sh 'postgresql://user:password@host.neon.tech/dbname?sslmode=require'
   ```

## Step 5: Test
```bash
npm run dev
# Open http://localhost:3000/auth/login
# Email: admin@mimi.agency
# Password: mimi2024
```

---

## Alternative Databases

If you prefer different providers:

### Vercel Postgres
- Premium (paid) but integrated with Vercel
- https://vercel.com/storage/postgres

### Railway
- Free tier available
- https://railway.app

### AWS RDS
- More complex setup
- But reliable for production

---

**Recommended for now: Neon** (free, reliable, easy setup)
