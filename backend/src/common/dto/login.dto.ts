import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Body of POST /auth/login.
 *
 * Deliberately does NOT reuse RegisterDto. Applying the registration password
 * policy here would lock out any account created before the policy existed, and
 * would leak the policy itself to an attacker probing the login endpoint. Login
 * only needs the fields to be present and well-formed; whether the credentials
 * are correct is decided by the bcrypt comparison, not by validation.
 */
export class LoginDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MaxLength(72)
  password!: string;
}
