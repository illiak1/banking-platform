import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

interface ResolvedError {
  status: number;
  message: string;
  details?: unknown;
}

/**
 * Catches everything that escapes a controller and turns it into a consistent
 * JSON body with a truthful status code.
 *
 * Before this filter, domain failures were raised as plain `new Error(...)`,
 * which Nest maps to 500 with the body replaced by "Internal server error" —
 * so a routine insufficient-funds rejection was indistinguishable from a crash,
 * both for the user and in the logs.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, details } = this.resolve(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${status}: ${message}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(details ? { errors: details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        return { status, message: body };
      }

      const payload = body as { message?: string | string[] };

      // ValidationPipe reports every failed constraint as an array. Keep the list
      // under `errors` so clients can show per-field messages.
      if (Array.isArray(payload.message)) {
        return { status, message: 'Validation failed', details: payload.message };
      }

      return { status, message: payload.message ?? exception.message };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return {
            status: HttpStatus.CONFLICT,
            message: 'A record with those details already exists',
          };
        case 'P2025':
          return { status: HttpStatus.NOT_FOUND, message: 'Record not found' };
        case 'P2003':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Referenced record does not exist',
          };
        default:
          break;
      }
    }

    // The CHECK constraint is the database-level backstop against overdraft. If
    // it ever fires, the application-level guard was bypassed — report it as a
    // client error rather than a crash, but it is worth investigating.
    const raw = exception instanceof Error ? exception.message : '';
    if (raw.includes('check_nonnegative_balance')) {
      this.logger.error(
        'Overdraft blocked by the database CHECK constraint — the application-level guard did not catch it',
      );
      return { status: HttpStatus.BAD_REQUEST, message: 'Insufficient funds' };
    }

    // Never leak an unrecognised error's text to the client.
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
