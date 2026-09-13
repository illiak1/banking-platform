import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Body of POST /auth/register. */
export class RegisterDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(254, { message: 'Email is too long' })
  email!: string;

  /**
   * The 72-character ceiling is not arbitrary: bcrypt silently truncates input
   * beyond 72 bytes, so anything longer gives a false sense of strength.
   */
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72, { message: 'Password must be at most 72 characters long' })
  @IsStrongPassword(
    { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    {
      message:
        'Password must contain upper and lower case letters, a number and a symbol',
    },
  )
  password!: string;
}
