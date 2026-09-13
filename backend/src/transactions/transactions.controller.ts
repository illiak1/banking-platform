// backend/src/transactions/transactions.controller.ts
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TransferDto } from '../common/dto/transfer.dto';
// `import type` because AuthenticatedRequest is an interface with no runtime
// value. TransferDto above must stay a value import: emitDecoratorMetadata needs
// the real class for ValidationPipe to know what to validate against.
import type { AuthenticatedRequest } from '../types/express';
import { TransactionsService } from './transactions.service';

/**
 * Thin HTTP layer. All balance logic lives in TransactionsService so it can be
 * tested without standing up an HTTP server.
 *
 * The sender is always derived from `req.user.id` (set by JwtAuthGuard from the
 * verified token) and never from the request body — taking it from the body
 * would let any authenticated caller move money out of someone else's account.
 */
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  getUserTransactions(@Req() req: AuthenticatedRequest) {
    return this.transactions.findForUser(req.user.id);
  }

  @Post('transfer')
  transfer(@Req() req: AuthenticatedRequest, @Body() dto: TransferDto) {
    return this.transactions.transfer(req.user.id, dto);
  }
}
