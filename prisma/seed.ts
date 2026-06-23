import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Production seed — a single admin account, no demo data.
 *
 * Re-running wipes every table (in dependency order) and recreates the admin.
 * Override credentials via ADMIN_EMAIL / ADMIN_PASSWORD env vars if needed.
 */
async function main() {
  console.log('🌱 Seeding mimi-agency (clean)…');

  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.platform.deleteMany();
  await prisma.audienceBreakdown.deleteMany();
  await prisma.monthlyReport.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const email = process.env.ADMIN_EMAIL ?? 'admin@mimi.agency';
  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'mimi2024', 10);

  await prisma.user.create({
    data: {
      email,
      password,
      name: 'mimi admin',
      phone: '+992 07 021 77 55',
      role: Role.ADMIN,
    },
  });

  console.log('✅ Clean database. Admin only:');
  console.log(`   ADMIN → ${email} / ${process.env.ADMIN_PASSWORD ?? 'mimi2024'}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
