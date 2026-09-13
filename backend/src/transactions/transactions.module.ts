import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsGateway } from './transactions.gateway';
import { TransactionsService } from './transactions.service';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsGateway],
})
export class TransactionsModule {}
