import 'next-auth';
import { Role, Tariff } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    role: Role;
    /** Все специальности сотрудника; основная — role. */
    roles: Role[];
    tariff: Tariff;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      roles: Role[];
      tariff: Tariff;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    /** Нет в токенах, выданных до появления нескольких ролей. */
    roles?: Role[];
    tariff: Tariff;
  }
}
