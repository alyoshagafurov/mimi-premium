# MIMI Agency — Render Deployment Guide

## ✅ Project Status: PRODUCTION-READY

### Build Verification
- ✅ TypeScript compilation: 0 errors
- ✅ Next.js build: 21/21 routes compiled
- ✅ Prisma schema: valid and properly typed
- ✅ All dependencies: installed and audited
- ✅ Git repository: initialized with clean history
- ✅ Case sensitivity: verified for Linux/Render compatibility

### What's Included
- 📱 Premium dark luxury UI (purple + lime + orange branding)
- 🎨 3D storytelling landing page with 5 morphing particle scenes
- 🔐 Full authentication system (NextAuth.js + JWT)
- 📊 Admin dashboard with campaign/client/metrics management
- 👥 Client dashboard with ROMI analytics and KPIs
- 📞 Contact form and lead management
- 💳 Pricing page with checkout flow
- 📱 Mobile-responsive design with premium burger menu
- ⚡ Production-optimized builds with code splitting

---

## 🚀 Deployment Steps

### Step 1: Push to GitHub

Replace `YOUR_USERNAME` with your GitHub username:

```bash
git remote add origin https://github.com/YOUR_USERNAME/mimi-agency-v2.git
git push -u origin main
```

### Step 2: Create PostgreSQL Database

Choose one option:

**Option A: Render PostgreSQL (Recommended)**
1. In Render dashboard → New → PostgreSQL
2. Note the connection string (Internal Database URL)

**Option B: External Provider**
- Neon: https://neon.tech (free tier available)
- Railway: https://railway.app
- AWS RDS, DigitalOcean, etc.

### Step 3: Create Web Service in Render

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Select your GitHub repository
4. Fill in:
   - **Name**: `mimi-agency` (your choice)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run db:push && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Standard ($12/month minimum)

### Step 4: Add Environment Variables

In Render dashboard, go to Service → Environment:

```
DATABASE_URL=postgresql://user:password@host:5432/database
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=https://your-service-name.onrender.com
NEXT_PUBLIC_APP_URL=https://your-service-name.onrender.com
NEXT_PUBLIC_BRAND_PHONE=+992 07 021 77 55
NEXT_PUBLIC_BRAND_INSTAGRAM=https://instagram.com/mimi.agency.tj
NEXT_PUBLIC_BRAND_WEB=mimi.agency.tj.com
NEXT_PUBLIC_BRAND_EMAIL=hello@mimi.agency.tj
```

### Step 5: Deploy

1. Render will automatically detect the commit and start deploying
2. First deployment takes **5-10 minutes**
3. Check the **Logs** tab if there are issues

### Step 6: Seed Database (First Time Only)

After successful deployment:

1. Click **Shell** tab in Render
2. Run: `npm run db:seed`
3. This creates the admin account

---

## 👤 Default Login Credentials

After seeding:
- **Email**: `admin@mimi.agency`
- **Password**: `mimi2024`

⚠️ **Change this immediately in production!**

---

## 🔧 Environment Variables Reference

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | ✅ | 32-byte base64 random string |
| `NEXTAUTH_URL` | ✅ | `https://your-app.onrender.com` |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://your-app.onrender.com` |
| `NEXT_PUBLIC_BRAND_PHONE` | ✅ | `+992 07 021 77 55` |
| `NEXT_PUBLIC_BRAND_INSTAGRAM` | ✅ | `https://instagram.com/mimi.agency.tj` |
| `NEXT_PUBLIC_BRAND_WEB` | ✅ | `mimi.agency.tj.com` |
| `NEXT_PUBLIC_BRAND_EMAIL` | ✅ | `hello@mimi.agency.tj` |

---

## 🛠️ Database Migrations

After initial seed, to run migrations:

```bash
npm run db:push      # Apply schema changes
npm run db:migrate   # Create migration files
npm run db:studio    # GUI database manager (local only)
```

---

## 📈 Monitoring & Maintenance

1. **Logs**: Check Render dashboard → Service → Logs
2. **Metrics**: Monitor CPU, Memory, Disk usage
3. **Health**: Render auto-restarts failed services
4. **Database**: Monitor PostgreSQL connections

---

## ⚠️ Common Issues

### Build Fails: "DATABASE_URL not found"
- ✅ This is normal during build
- Database is only needed at runtime
- If build still fails, check Node version (should be 18+)

### App Crashes on Start
- Check `.env` variables are set correctly
- Verify DATABASE_URL format
- Check Render logs for specific errors

### Database Connection Timeout
- Verify DATABASE_URL is accessible from Render
- Check PostgreSQL firewall rules
- For Render-internal DB: use Internal Database URL in service-to-service connections

### Admin Login Not Working
- Verify `npm run db:seed` was run
- Check admin@mimi.agency exists in database
- Default password: mimi2024

---

## 🔒 Security Checklist

- [ ] Change default admin password immediately
- [ ] Use strong NEXTAUTH_SECRET (32+ bytes)
- [ ] Enable HTTPS (Render does this automatically)
- [ ] Set up proper CORS if using separate frontend
- [ ] Regular database backups
- [ ] Monitor authentication logs
- [ ] Update dependencies regularly (`npm audit fix`)

---

## 📞 Support & Docs

- **Next.js**: https://nextjs.org/docs
- **Render**: https://render.com/docs
- **Prisma**: https://www.prisma.io/docs
- **NextAuth.js**: https://next-auth.js.org

---

**Status**: ✅ Ready for production deployment
**Last Updated**: 2026-05-26
