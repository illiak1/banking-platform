import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module'; // <- исправлено
import { TransactionsModule } from './transactions/transactions.module'; // <- исправлено
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,         // <- обязательно
    TransactionsModule,  // <- обязательно
  ],
})
export class AppModule {}