import 'next-auth';
import { Role, Tariff } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    role: Role;
    tariff: Tariff;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      tariff: Tariff;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    tariff: Tariff;
  }
}
