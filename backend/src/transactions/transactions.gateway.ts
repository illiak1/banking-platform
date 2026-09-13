// backend/src/transactions/transactions.gateway.ts
import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import * as jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';

interface JwtPayload {
  id: number;
  email: string;
}

export interface TransferNotification {
  transactionId: number;
  amount: number;
  createdAt: Date;
  fromUserId: number;
  fromEmail: string;
  toUserId: number;
  toEmail: string;
}

/** Every socket for a given user joins this room, so a transfer is one `server.to(...).emit()` per side. */
function roomForUser(userId: number): string {
  return `user:${userId}`;
}

/**
 * Pushes a 'transaction' event to both sides of a transfer the instant it
 * commits, so an open Dashboard updates without a manual refresh.
 *
 * The `cors.origin` list below is intentionally hardcoded rather than read
 * from `process.env.CORS_ORIGIN` (as main.ts's HTTP CORS does): main.ts
 * imports AppModule — and therefore this gateway — before it calls
 * `dotenv.config()`, and a `@WebSocketGateway(...)` decorator's argument is
 * evaluated once at class-definition time (import time), not when a client
 * connects. Reading `process.env.CORS_ORIGIN` here would silently always see
 * `undefined`, no matter what backend/.env says. Anything that must see the
 * real env (like the JWT secret below) is read inside a method body instead,
 * which only runs after the app has actually booted.
 */
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
export class TransactionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TransactionsGateway.name);

  /**
   * Authenticates the socket at connect time using the same JWT scheme as
   * JwtAuthGuard (same secret, same algorithm pin) — there is no separate
   * WebSocket auth story. A socket that fails this is disconnected outright;
   * nothing it could otherwise receive is worth accepting an unverified
   * connection for.
   */
  handleConnection(socket: Socket): void {
    const token = socket.handshake.auth?.token;

    if (typeof token !== 'string' || !token) {
      this.logger.warn(`Rejected socket ${socket.id}: no token provided`);
      socket.disconnect(true);
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      this.logger.error('JWT_SECRET is not configured — rejecting all socket connections');
      socket.disconnect(true);
      return;
    }

    try {
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as JwtPayload;
      socket.data.userId = decoded.id;
      socket.join(roomForUser(decoded.id));
    } catch {
      this.logger.warn(`Rejected socket ${socket.id}: invalid or expired token`);
      socket.disconnect(true);
    }
  }

  handleDisconnect(): void {
    // Socket.IO removes a disconnected socket from every room it was in on
    // its own — nothing to clean up here.
  }

  /**
   * Called by TransactionsService once a transfer has committed — never from
   * inside the database transaction itself. A slow or failed socket emit
   * must not be able to hold a DB transaction open, and an interactive
   * transaction that Prisma retries could otherwise fire this notification
   * more than once for the same transfer.
   */
  notifyTransfer(payload: TransferNotification): void {
    const base = {
      id: payload.transactionId,
      amount: payload.amount,
      createdAt: payload.createdAt,
    };

    // Same shape GET /transactions already returns (direction +
    // counterpartyEmail), so the frontend can treat a pushed event exactly
    // like a row from that endpoint.
    this.server.to(roomForUser(payload.fromUserId)).emit('transaction', {
      ...base,
      direction: 'OUT',
      counterpartyEmail: payload.toEmail,
    });

    this.server.to(roomForUser(payload.toUserId)).emit('transaction', {
      ...base,
      direction: 'IN',
      counterpartyEmail: payload.fromEmail,
    });
  }
}
