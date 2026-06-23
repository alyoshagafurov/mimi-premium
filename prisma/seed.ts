import {
  PrismaClient,
  Role,
  Tariff,
  CampaignStatus,
  ClientStatus,
  DealStage,
  TaskPriority,
  ActivityKind,
  PaymentStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const today = new Date();
today.setHours(12, 0, 0, 0);
const addDays = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d;
};
const CUR_MONTH = today.getMonth() + 1;
const CUR_YEAR = today.getFullYear();

/**
 * Seed the mimi agency CRM with a working dataset:
 *   • 2 admin/team users
 *   • 2 client accounts, each with 2 monthly reports (platforms / campaigns / audience)
 *   • payments (paid / pending / overdue), tasks, activities
 *   • a sales pipeline of deals across all stages
 *
 * Re-running is safe — every table is wiped in dependency order first.
 */
async function main() {
  console.log('🌱 Seeding mimi-agency CRM…');

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

  // 1. Team
  const adminPwd = await bcrypt.hash('mimi2024', 10);
  const admin = await prisma.user.create({
    data: { email: 'admin@mimi.agency', password: adminPwd, name: 'mimi admin', phone: '+992 07 021 77 55', role: Role.ADMIN },
  });
  const manager = await prisma.user.create({
    data: { email: 'sabina@mimi.agency', password: adminPwd, name: 'Сабина Рахимова', phone: '+992 90 700 11 22', role: Role.ADMIN },
  });

  // 2. Clients + monthly reports
  const clientPwd = await bcrypt.hash('client2024', 10);

  const aestheticUser = await prisma.user.create({
    data: {
      email: 'aesthetic@mimi.dev', password: clientPwd, name: 'Алина Каримова', phone: '+992 90 111 22 33',
      role: Role.CLIENT, tariff: Tariff.PREMIUM, tariffEnd: addDays(12),
      client: { create: { businessName: 'Aesthetic Clinic', niche: 'Эстетическая медицина', status: ClientStatus.ACTIVE } },
    },
    include: { client: true },
  });
  const fitnessUser = await prisma.user.create({
    data: {
      email: 'fitness@mimi.dev', password: clientPwd, name: 'Рустам Холов', phone: '+992 90 222 33 44',
      role: Role.CLIENT, tariff: Tariff.GROWTH, tariffEnd: addDays(95),
      client: { create: { businessName: 'Studio Forma', niche: 'Премиум фитнес', status: ClientStatus.ACTIVE } },
    },
    include: { client: true },
  });

  const aesthetic = aestheticUser.client!;
  const fitness = fitnessUser.client!;

  const report = (clientId: string, month: number, ig: [number, number], fb: [number, number], data: { spent: number; budget: number; reach: number; clicks: number; leads: number }, aud: [number, number, number, number], campaigns: { name: string; platform: string; status: CampaignStatus }[]) =>
    prisma.monthlyReport.create({
      data: {
        clientId, month, year: 2026, ...data,
        platforms: { create: [{ name: 'Instagram', spent: ig[0], roas: ig[1] }, { name: 'Facebook', spent: fb[0], roas: fb[1] }] },
        audience: { create: { age18_24: aud[0], age25_34: aud[1], age35_44: aud[2], age45plus: aud[3] } },
        campaigns: { create: campaigns },
      },
    });

  await report(aesthetic.id, 4, [11000, 3.1], [7000, 2.4], { spent: 18000, budget: 20000, reach: 145000, clicks: 8200, leads: 210 }, [30, 40, 20, 10], [
    { name: 'Reels — продвижение', platform: 'Instagram', status: CampaignStatus.ACTIVE },
    { name: 'Lead Gen — заявки', platform: 'Facebook', status: CampaignStatus.ACTIVE },
    { name: 'Retargeting — тёплые', platform: 'Instagram', status: CampaignStatus.PAUSED },
  ]);
  await report(aesthetic.id, 5, [13000, 3.4], [8000, 2.6], { spent: 21000, budget: 22000, reach: 168000, clicks: 9100, leads: 245 }, [28, 42, 21, 9], [
    { name: 'Reels — продвижение', platform: 'Instagram', status: CampaignStatus.ACTIVE },
    { name: 'Lead Gen — заявки', platform: 'Facebook', status: CampaignStatus.ACTIVE },
    { name: 'Летняя акция', platform: 'Instagram', status: CampaignStatus.ACTIVE },
  ]);
  await report(fitness.id, 4, [5500, 2.8], [3500, 2.1], { spent: 9000, budget: 10000, reach: 78000, clicks: 5400, leads: 120 }, [38, 36, 18, 8], [
    { name: 'Trial Offer — пробное', platform: 'Instagram', status: CampaignStatus.ACTIVE },
    { name: 'Бренд — охват', platform: 'Facebook', status: CampaignStatus.PAUSED },
  ]);
  await report(fitness.id, 5, [6000, 3.0], [3500, 2.3], { spent: 9500, budget: 10000, reach: 92000, clicks: 6100, leads: 142 }, [40, 35, 17, 8], [
    { name: 'Trial Offer — пробное', platform: 'Instagram', status: CampaignStatus.ACTIVE },
    { name: 'Бренд — охват', platform: 'Facebook', status: CampaignStatus.ACTIVE },
    { name: 'Абонементы — весна', platform: 'Instagram', status: CampaignStatus.FINISHED },
  ]);

  // 3. Payments
  await prisma.payment.createMany({
    data: [
      { clientId: aesthetic.id, amount: 12000, month: 4, year: 2026, status: PaymentStatus.PAID, paidAt: new Date('2026-04-03') },
      { clientId: aesthetic.id, amount: 12000, month: 5, year: 2026, status: PaymentStatus.PAID, paidAt: new Date('2026-05-04') },
      { clientId: aesthetic.id, amount: 12000, month: CUR_MONTH, year: CUR_YEAR, status: PaymentStatus.PAID, paidAt: today },
      { clientId: fitness.id, amount: 8000, month: 4, year: 2026, status: PaymentStatus.PAID, paidAt: new Date('2026-04-05') },
      { clientId: fitness.id, amount: 8000, month: 5, year: 2026, status: PaymentStatus.PAID, paidAt: new Date('2026-05-06') },
      { clientId: fitness.id, amount: 8000, month: CUR_MONTH, year: CUR_YEAR, status: PaymentStatus.OVERDUE, dueDate: addDays(-5) },
    ],
  });

  // 4. Sales pipeline
  const won1 = await prisma.deal.create({
    data: { title: 'Aesthetic Clinic', contactName: 'Алина Каримова', phone: '+992 90 111 22 33', email: 'aesthetic@mimi.dev', source: 'Реферал', stage: DealStage.WON, amount: 12000, ownerId: admin.id, clientId: aesthetic.id },
  });
  await prisma.deal.create({
    data: { title: 'Studio Forma', contactName: 'Рустам Холов', phone: '+992 90 222 33 44', source: 'Instagram', stage: DealStage.WON, amount: 8000, ownerId: manager.id, clientId: fitness.id },
  });
  const dealSmile = await prisma.deal.create({
    data: { title: 'Стоматология Smile', contactName: 'Фарход Юсупов', phone: '+992 90 555 66 77', email: 'smile@dent.tj', source: 'Лендинг', stage: DealStage.NEGOTIATION, amount: 8000, ownerId: manager.id, message: 'Нужен поток пациентов на имплантацию.' },
  });
  const dealPulse = await prisma.deal.create({
    data: { title: 'Фитнес Pulse', contactName: 'Дильноза', phone: '+992 90 444 33 22', source: 'Лендинг', stage: DealStage.PROPOSAL, amount: 12000, ownerId: admin.id, message: 'Запуск нового зала, нужен старт с трафиком.' },
  });
  await prisma.deal.create({
    data: { title: 'Кофейня Aurora', contactName: 'Лола Мирзоева', phone: '+992 90 444 55 66', email: 'aurora@cafe.tj', source: 'Лендинг', stage: DealStage.NEW, amount: 5000, message: 'Соцсети + контент для новой кофейни.' },
  });
  await prisma.deal.create({
    data: { title: 'Барбершоп Lion', contactName: 'Камрон', phone: '+992 90 999 88 77', source: 'Instagram', stage: DealStage.NEW, amount: 5000 },
  });
  await prisma.deal.create({
    data: { title: 'Магазин цветов', contactName: 'Зарина', phone: '+992 90 222 11 00', source: 'Лендинг', stage: DealStage.LOST, amount: 0, message: 'Не устроил бюджет.' },
  });

  // 5. Tasks
  await prisma.task.createMany({
    data: [
      { title: 'Позвонить в Стоматологию Smile', dealId: dealSmile.id, ownerId: manager.id, priority: TaskPriority.HIGH, dueDate: addDays(-2) },
      { title: 'Отправить КП — Фитнес Pulse', dealId: dealPulse.id, ownerId: admin.id, priority: TaskPriority.HIGH, dueDate: today },
      { title: 'Подготовить отчёт за май — Aesthetic', clientId: aesthetic.id, ownerId: admin.id, priority: TaskPriority.MEDIUM, dueDate: addDays(2) },
      { title: 'Напомнить о продлении тарифа', clientId: aesthetic.id, ownerId: manager.id, priority: TaskPriority.MEDIUM, dueDate: addDays(5) },
      { title: 'Согласовать креативы — Studio Forma', clientId: fitness.id, ownerId: admin.id, priority: TaskPriority.LOW, dueDate: addDays(4) },
      { title: 'Завести рекламный кабинет', clientId: fitness.id, ownerId: admin.id, priority: TaskPriority.MEDIUM, done: true },
    ],
  });

  // 6. Activities (notes & history)
  await prisma.activity.createMany({
    data: [
      { kind: ActivityKind.CALL, body: 'Созвон по результатам мая — клиент доволен ростом заявок.', clientId: aesthetic.id, authorId: admin.id },
      { kind: ActivityKind.NOTE, body: 'Согласовали бюджет 22 000 сомони на июнь.', clientId: aesthetic.id, authorId: admin.id },
      { kind: ActivityKind.MEETING, body: 'Встреча по стратегии Q3.', clientId: fitness.id, authorId: manager.id },
      { kind: ActivityKind.NOTE, body: 'Запросили КП, готовят решение до конца недели.', dealId: dealSmile.id, authorId: manager.id },
    ],
  });

  // touch won1 so linter keeps the reference meaningful
  void won1;

  console.log('✅ CRM seeded.\n');
  console.log('   ADMIN  → admin@mimi.agency   / mimi2024');
  console.log('   ADMIN  → sabina@mimi.agency  / mimi2024');
  console.log('   CLIENT → aesthetic@mimi.dev  / client2024');
  console.log('   CLIENT → fitness@mimi.dev    / client2024\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
