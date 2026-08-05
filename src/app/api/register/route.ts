import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { clientIp } from '@/lib/request';
import { captureError } from '@/lib/monitoring';
import {
  emailProblem, normalizeEmail, emailDomain,
  passwordProblem, phoneProblem, normalizePhone,
} from '@/lib/validation';
import { domainCanReceiveMail } from '@/lib/email-dns';
import { sendVerificationCode } from '@/lib/email-verify';
import { notifySales } from '@/lib/notify';

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().max(160),
  phone: z.string().max(40),
  password: z.string().max(200),
});

export async function POST(req: Request) {
  // Throttle: max 5 registrations per IP per 10 minutes
  const ip = clientIp(req);
  const limited = await rateLimit(`register:${ip}`, 5, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Слишком много попыток. Попробуйте позже.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // ── Validation (same rules as the form; the server is the authority) ──
    const emailErr = emailProblem(data.email);
    if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });

    const phoneErr = phoneProblem(data.phone);
    if (phoneErr) return NextResponse.json({ error: phoneErr }, { status: 400 });

    const passErr = passwordProblem(data.password);
    if (passErr) return NextResponse.json({ error: passErr }, { status: 400 });

    const email = normalizeEmail(data.email);
    const phone = normalizePhone(data.phone);

    // The domain must actually be able to receive mail — blocks invented domains.
    const dnsCheck = await domainCanReceiveMail(emailDomain(email));
    if (!dnsCheck.ok) {
      return NextResponse.json({ error: dnsCheck.reason ?? 'Проверьте email' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email уже занят' }, { status: 400 });

    // Public self-registration ALWAYS creates a CLIENT. Admin accounts are
    // provisioned via the seed/console only — never through this endpoint.
    const password = await bcrypt.hash(data.password, 12);
    const name = data.name.trim();

    const user = await prisma.user.create({
      data: {
        email,
        password,
        name,
        phone,
        role: 'CLIENT',
        // Business name / niche are collected later (onboarding brief or by the
        // sales team in the CRM), so we seed the profile with a placeholder.
        client: { create: { businessName: name, niche: 'Не указана' } },
      },
    });

    // A self-registered client is a fresh CRM lead — alert the sales team so it
    // gets picked up. Never let a notification failure block registration.
    notifySales({
      kind: 'LEAD',
      title: 'Новый лид',
      body: `${name} зарегистрировался — ${phone}`,
      link: '/admin/sales',
    }).catch(() => {});

    // Email confirmation. If Resend isn't configured yet, auto-verify so the
    // flow keeps working; once RESEND_API_KEY is set, a real code is required.
    const sent = await sendVerificationCode({ id: user.id, email, name });
    if (!sent) {
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
    }

    return NextResponse.json({ id: user.id, role: user.role, needsVerification: sent });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: 'Проверьте корректность полей' }, { status: 400 });
    }
    captureError(e, { where: 'register' });
    return NextResponse.json({ error: 'Не удалось зарегистрироваться' }, { status: 400 });
  }
}
