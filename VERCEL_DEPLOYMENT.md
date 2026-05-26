# MIMI Agency — Vercel Deployment Guide

## ✅ Deployment Ready

This project is fully configured for Vercel deployment with automatic Next.js detection.

## Quick Start

### 1. Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/mimi-agency-v2.git
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Paste: `https://github.com/YOUR_USERNAME/mimi-agency-v2`
4. Click "Import"

### 3. Vercel Auto-Configuration
- ✅ Framework: Next.js (auto-detected)
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `.next`
- ✅ Node Version: 18.x
- ✅ Root Directory: `/` (default)

### 4. Add Environment Variables
Click "Environment Variables" and add:

```
DATABASE_URL=postgresql://user:pass@host:5432/database
NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_BRAND_PHONE=+992 07 021 77 55
NEXT_PUBLIC_BRAND_INSTAGRAM=https://instagram.com/mimi.agency.tj
NEXT_PUBLIC_BRAND_WEB=mimi.agency.tj.com
NEXT_PUBLIC_BRAND_EMAIL=hello@mimi.agency.tj
```

### 5. Deploy
Click "Deploy" — Vercel will:
1. Clone your repository
2. Install dependencies
3. Run build command
4. Deploy to production

## Files for Vercel

✅ **vercel.json** — Explicit configuration (Vercel will respect this)
✅ **package.json** — Next.js 14.2.16 with all dependencies
✅ **next.config.js** — Next.js configuration
✅ **tsconfig.json** — TypeScript strict mode
✅ **src/** — App Router structure
✅ **prisma/** — Database schema

## Database Setup

For Vercel, use one of:

### Option 1: Vercel Postgres (Recommended)
```bash
# In Vercel dashboard:
# Storage → Create → Postgres
# Copy CONNECTION_STRING → DATABASE_URL env var
```

### Option 2: External Provider
- **Neon**: Free tier available — https://neon.tech
- **Railway**: Fast deployment — https://railway.app
- **AWS RDS**, **DigitalOcean**, **Supabase**, etc.

## Domain Setup

After deployment:

1. Go to Vercel project settings
2. Domains → Add custom domain
3. Point your domain DNS to Vercel
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` env vars

## Monitoring

- **Logs**: Vercel Dashboard → Deployments → Function Logs
- **Analytics**: Vercel Dashboard → Analytics
- **Errors**: Vercel Dashboard → Deployments → Error Logs

## Troubleshooting

**Build fails with "DATABASE_URL not found":**
- Normal during build (database not needed during build)
- Ensure DATABASE_URL is set in environment variables
- If build still fails, check Node version (should be 18+)

**App crashes after deploy:**
- Check "Function Logs" in Vercel dashboard
- Verify all environment variables are set
- Ensure DATABASE_URL is accessible from Vercel

**NextAuth not working:**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Ensure NEXTAUTH_URL ends without slash

## Performance Tips

- ✅ Static pages are pre-cached by Vercel Edge Network
- ✅ API routes auto-scale on serverless functions
- ✅ Images optimized with Next.js Image component
- ✅ Bundle optimized (87.4 KB shared)

## Security Checklist

- [ ] Change default admin password (mimi2024)
- [ ] Generate new NEXTAUTH_SECRET
- [ ] Enable HTTPS (Vercel does by default)
- [ ] Set up database backups
- [ ] Review environment variables (no secrets in code)
- [ ] Enable Vercel Web Analytics

## Support

- **Next.js**: https://nextjs.org/docs
- **Vercel**: https://vercel.com/docs
- **Prisma**: https://www.prisma.io/docs
- **NextAuth**: https://next-auth.js.org

---

**Status**: ✅ Ready for Vercel deployment
**Framework**: Next.js 14.2.16
**Database**: PostgreSQL (external)
**Last Updated**: 2026-05-27
