import { IsEmail, IsNotEmpty } from 'class-validator';

/** Query params for GET /users/search. */
export class SearchUserDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;
}
