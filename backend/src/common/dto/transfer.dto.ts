import { IsEmail, IsNotEmpty, IsNumber, IsPositive, Max } from 'class-validator';

/**
 * Body of POST /transactions/transfer.
 *
 * The @IsPositive() guard is the fix for the exploit where a negative amount
 * inverted the transfer: `balance < -100` is false, so the old funds check passed
 * and the decrement/increment pair moved money *from* the recipient *to* the
 * sender. Rejecting non-positive amounts at the edge closes that hole for good.
 */
export class TransferDto {
  @IsNotEmpty({ message: 'Recipient email is required' })
  @IsEmail({}, { message: 'Recipient email must be a valid email address' })
  toEmail!: string;

  /**
   * maxDecimalPlaces also rejects NaN and Infinity, which would otherwise reach
   * the database and corrupt the balance.
   */
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'Amount must be a number with at most 2 decimal places' },
  )
  @IsPositive({ message: 'Amount must be greater than zero' })
  @Max(1_000_000, { message: 'Amount exceeds the maximum transfer limit' })
  amount!: number;
}
