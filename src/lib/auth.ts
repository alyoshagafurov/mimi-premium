import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const isProd = process.env.NODE_ENV === 'production';

/**
 * A secret MUST be set via NEXTAUTH_SECRET in production. We fall back to a
 * constant only to avoid a hard crash if the env var is missing on a given
 * deploy — combined with getSafeSession(), a secret mismatch then degrades to
 * "logged out" instead of a 500. Set a strong NEXTAUTH_SECRET in Vercel.
 */
const authSecret = process.env.NEXTAUTH_SECRET || 'mimi-fallback-secret-set-NEXTAUTH_SECRET-in-env';
if (isProd && !process.env.NEXTAUTH_SECRET) {
  console.error('[auth] NEXTAUTH_SECRET is not set — set it in the environment for secure, stable sessions.');
}

const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: { signIn: '/auth/login' },
  useSecureCookies: isProd,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        // No password → Google-only account; must use "Continue with Google".
        if (!user || !user.password) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role, tariff: user.tariff };
      },
    }),
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Credentials: block until the email is confirmed.
      if (account?.provider === 'credentials') {
        const dbUser = await prisma.user.findUnique({ where: { email: (user.email ?? '').toLowerCase() } });
        if (!dbUser?.emailVerified) return false;
        // Сотрудник, зарегистрировавшийся сам, ждёт одобрения администратора.
        if (dbUser.role !== 'CLIENT' && !dbUser.approvedAt) return '/auth/login?error=pending';
        return true;
      }
      // Google: upsert the account; Google has already verified the email.
      if (account?.provider === 'google') {
        const email = (user.email ?? '').toLowerCase();
        if (!email) return false;
        const existing = await prisma.user.findUnique({ where: { email } });
        const name = user.name ?? (profile as any)?.name ?? email.split('@')[0];
        if (!existing) {
          await prisma.user.create({
            data: {
              email,
              name,
              role: 'CLIENT',
              emailVerified: new Date(),
              avatar: (profile as any)?.picture ?? null,
              client: { create: { businessName: name, niche: 'Не указана' } },
            },
          });
        } else if (!existing.emailVerified) {
          await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
        }
        return true;
      }
      return true;
    },
    async jwt({ token, user }) {
      // On sign-in, resolve our real DB id/role/tariff by email (works for both
      // credentials and Google, whose `user` is the OAuth profile).
      if (user) {
        const email = (user.email ?? (token.email as string) ?? '').toLowerCase();
        if (email) {
          const dbUser = await prisma.user.findUnique({ where: { email } });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.tariff = dbUser.tariff;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).tariff = token.tariff;
      }
      return session;
    },
  },
  secret: authSecret,
};
