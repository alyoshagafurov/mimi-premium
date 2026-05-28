#!/bin/bash

echo "🔧 MIMI Agency — Local Database Setup"
echo "========================================"
echo ""
echo "This script will:"
echo "  1. Update .env with your DATABASE_URL"
echo "  2. Generate Prisma client"
echo "  3. Apply database migrations"
echo "  4. Seed admin account + demo data"
echo ""

# Check if DATABASE_URL is provided as argument
if [ -z "$1" ]; then
    echo "❌ Database URL not provided."
    echo ""
    echo "Usage:"
    echo "  ./setup-local-db.sh 'postgresql://user:pass@host:5432/dbname'"
    echo ""
    echo "How to get DATABASE_URL:"
    echo "  • Vercel Postgres: Storage → Postgres → CONNECTION_STRING"
    echo "  • Neon: https://console.neon.tech → Connection string"
    echo "  • Railway: https://railway.app → Database → Connection string"
    echo ""
    exit 1
fi

DATABASE_URL="$1"

# Update .env file
echo ""
echo "📝 Updating .env with your database connection..."
cat > .env << ENVEOF
DATABASE_URL="$DATABASE_URL"
NEXTAUTH_SECRET="dev-secret-$(openssl rand -base64 16)"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BRAND_PHONE="+992 07 021 77 55"
NEXT_PUBLIC_BRAND_INSTAGRAM="https://instagram.com/mimi.agency.tj"
NEXT_PUBLIC_BRAND_WEB="mimi.agency.tj.com"
NEXT_PUBLIC_BRAND_EMAIL="hello@mimi.agency.tj"
ENVEOF

echo "✅ .env updated"
echo ""

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"
echo ""

# Run migrations
echo "🗄️  Applying database schema..."
npx prisma db push --skip-generate
if [ $? -ne 0 ]; then
    echo "❌ Database migration failed!"
    echo "   Check your DATABASE_URL and try again."
    exit 1
fi
echo "✅ Database schema applied"
echo ""

# Seed database
echo "🌱 Seeding admin account + demo data..."
npm run db:seed
if [ $? -ne 0 ]; then
    echo "❌ Database seeding failed!"
    exit 1
fi
echo "✅ Database seeded"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "Admin account created:"
echo "  Email:    admin@mimi.agency"
echo "  Password: mimi2024"
echo ""
echo "Next steps:"
echo "  1. npm run dev          (start development server)"
echo "  2. http://localhost:3000 (open in browser)"
echo "  3. Log in with credentials above"
echo ""
