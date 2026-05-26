import {
  PrismaClient,
  Role,
  Tariff,
  CampaignStatus,
  LeadStatus,
  ContactStatus,
  ClientStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed mimi agency database with a working dataset:
 *   • 1 admin user
 *   • 4 client accounts (each owns a Client business)
 *   • Realistic campaigns per client
 *   • 60 days of daily metrics per client
 *   • 12 leads + 8 contact-requests with mixed statuses
 *
 * Re-running is safe — every table is wiped in dependency order first.
 */

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}
function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

async function main() {
  console.log('🌱 Seeding mimi-agency database…');

  // 1. Wipe in dependency order
  await prisma.metric.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.contactRequest.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  // 2. Admin user
  const adminPwd = await bcrypt.hash('mimi2024', 10);
  await prisma.user.create({
    data: {
      email: 'admin@mimi.agency',
      password: adminPwd,
      name: 'mimi admin',
      phone: '+992 07 021 77 55',
      role: Role.ADMIN,
    },
  });

  // 3. Client accounts + businesses
  const clientPwd = await bcrypt.hash('client2024', 10);
  const clientSeeds = [
    {
      email: 'aesthetic@mimi.dev',
      name: 'Алина Каримова',
      phone: '+992 90 111 22 33',
      tariff: Tariff.PREMIUM,
      business: 'Aesthetic Clinic',
      niche: 'Эстетическая медицина',
    },
    {
      email: 'fitness@mimi.dev',
      name: 'Рустам Холов',
      phone: '+992 90 222 33 44',
      tariff: Tariff.GROWTH,
      business: 'Studio Forma',
      niche: 'Премиум фитнес',
    },
    {
      email: 'realty@mimi.dev',
      name: 'Дилшод Назаров',
      phone: '+992 90 333 44 55',
      tariff: Tariff.GROWTH,
      business: 'Capital Estate',
      niche: 'Премиум недвижимость',
    },
    {
      email: 'cafe@mimi.dev',
      name: 'Лола Мирзоева',
      phone: '+992 90 444 55 66',
      tariff: Tariff.START,
      business: 'Cafe Aurora',
      niche: 'HoReCa · кофейня',
    },
  ];

  const createdClients = await Promise.all(
    clientSeeds.map(async (c, i) => {
      const user = await prisma.user.create({
        data: {
          email: c.email,
          password: clientPwd,
          name: c.name,
          phone: c.phone,
          role: Role.CLIENT,
          tariff: c.tariff,
          tariffEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * (30 + i * 15)),
        },
      });
      const client = await prisma.client.create({
        data: {
          ownerId: user.id,
          businessName: c.business,
          niche: c.niche,
          status: ClientStatus.ACTIVE,
        },
      });
      return { user, client, seed: c };
    }),
  );

  // 4. Campaigns per client
  const platforms = ['Instagram', 'Facebook', 'Google Ads', 'TikTok', 'YouTube', 'Яндекс.Директ'];
  const campaignNames = [
    'Brand awareness — Q4',
    'Performance — leads',
    'Reels — продвижение',
    'Конверсии — посадка',
    'Retargeting — тёплые',
    'Search — premium intent',
  ];

  for (const { client } of createdClients) {
    const n = randInt(3, 5);
    for (let i = 0; i < n; i++) {
      const budget = randInt(50, 280) * 100;
      const spent = Math.round(budget * rand(0.4, 0.95));
      const leads = randInt(20, 180);
      const sales = Math.round(leads * rand(0.08, 0.32));
      const revenue = sales * randInt(2000, 9000);
      const romi = spent > 0 ? Math.round(((revenue - spent) / spent) * 100) : 0;
      await prisma.campaign.create({
        data: {
          clientId: client.id,
          name: pick(campaignNames),
          platform: pick(platforms),
          budget,
          spent,
          leads,
          sales,
          romi,
          status: pick<CampaignStatus>([
            CampaignStatus.ACTIVE,
            CampaignStatus.ACTIVE,
            CampaignStatus.ACTIVE,
            CampaignStatus.SCALING,
            CampaignStatus.PAUSED,
          ]),
        },
      });
    }
  }

  // 5. Daily metrics: last 60 days per client (gentle upward trend + noise)
  for (const { client } of createdClients) {
    const base = randInt(40, 120);
    for (let d = 60; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(12, 0, 0, 0);
      const growth = 1 + (60 - d) * 0.012; // gentle climb
      const clicks = Math.round(base * 8 * growth * rand(0.85, 1.15));
      const leadsCount = Math.round(base * 0.45 * growth * rand(0.85, 1.2));
      const qualified = Math.round(leadsCount * rand(0.45, 0.7));
      const sales = Math.round(qualified * rand(0.18, 0.38));
      const spent = Math.round(clicks * rand(8, 18));
      const revenue = Math.round(sales * randInt(2500, 7500));
      const romi = spent > 0 ? Math.round(((revenue - spent) / spent) * 100) : 0;
      await prisma.metric.create({
        data: {
          clientId: client.id,
          date,
          clicks,
          leads: leadsCount,
          qualified,
          sales,
          spent,
          revenue,
          romi,
        },
      });
    }
  }

  // 6. Internal lead pipeline (per client)
  const leadSources = ['Instagram', 'Web', 'Реферал', 'WhatsApp', 'Telegram', 'Яндекс.Директ'];
  const leadNames = ['Алексей', 'Дарья', 'Тимур', 'Ольга', 'Камрон', 'Зарина', 'Ирина', 'Парвиз', 'Шахром', 'Малика'];
  for (const { client } of createdClients) {
    const n = randInt(3, 6);
    for (let i = 0; i < n; i++) {
      const date = new Date();
      date.setDate(date.getDate() - randInt(0, 21));
      await prisma.lead.create({
        data: {
          clientId: client.id,
          name: pick(leadNames),
          contact: `+992 9${randInt(0, 9)} ${randInt(100, 999)} ${randInt(10, 99)} ${randInt(10, 99)}`,
          source: pick(leadSources),
          status: pick<LeadStatus>([LeadStatus.NEW, LeadStatus.NEW, LeadStatus.WORKING, LeadStatus.CLOSED]),
          createdAt: date,
        },
      });
    }
  }

  // 7. Contact requests on the landing form (incoming demo)
  const contactSeeds = [
    { name: 'Карим Шарипов', email: 'karim@premier-clinic.tj', phone: '+992 90 111 99 11', message: 'Хотим расширить эстетическую клинику, нужен audit + стратегия.', status: ContactStatus.NEW },
    { name: 'Анна Левитан', email: 'anna@studioforma.ru', phone: '+992 90 222 88 22', message: 'Запустили студию, нужен performance-маркетинг с первого месяца.', status: ContactStatus.WORKING },
    { name: 'Ферузшох', email: 'feruz@capital.tj', phone: '+992 90 333 77 33', message: 'Девелопер. Снизить CPL для премиум-сегмента.', status: ContactStatus.WORKING },
    { name: 'Лола Каримова', email: 'lola@cafe-aurora.tj', phone: '+992 90 444 66 44', message: 'Кофейня в центре. Соцсети + контент + посадка.', status: ContactStatus.NEW },
    { name: 'Тимур Назаров', email: 'timur@gymlabs.tj', phone: '+992 90 555 55 55', message: 'Сеть фитнес-клубов, нужен бренд + новые каналы.', status: ContactStatus.NEW },
    { name: 'Полина Свердлова', email: 'polina@beauty.tj', phone: '+992 90 666 44 66', message: 'Beauty-салон, нужен полный цикл — от стратегии до Reels.', status: ContactStatus.CLOSED },
    { name: 'Алексей Барсуков', email: 'alex@barsuckov.dev', phone: '+992 90 777 33 77', message: 'Личный бренд, эксперт по финансам. Запуск курса.', status: ContactStatus.WORKING },
    { name: 'Шерхон Эмомов', email: 'sher@premier-real.tj', phone: '+992 90 888 22 88', message: 'Недвижимость VIP. Хотим автоматизировать воронку.', status: ContactStatus.NEW },
  ];
  for (const cr of contactSeeds) {
    const date = new Date();
    date.setDate(date.getDate() - randInt(0, 14));
    date.setHours(randInt(9, 19), randInt(0, 59), 0, 0);
    await prisma.contactRequest.create({ data: { ...cr, createdAt: date } });
  }

  console.log('✅ Database seeded.\n');
  console.log('   ADMIN  → admin@mimi.agency / mimi2024');
  console.log('   CLIENT → aesthetic@mimi.dev / client2024');
  console.log('   CLIENT → fitness@mimi.dev   / client2024');
  console.log('   CLIENT → realty@mimi.dev    / client2024');
  console.log('   CLIENT → cafe@mimi.dev      / client2024\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
