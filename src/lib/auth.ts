import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
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
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tariff: user.tariff,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.tariff = (user as any).tariff;
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
