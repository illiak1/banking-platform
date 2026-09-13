import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';

const BCRYPT_ROUNDS = 10;
const TOKEN_TTL = '1h';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(email: string, password: string) {
    // 1. Check if the user already exists in the system
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // 2. Hash pass
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // 3. Create user together with their opening account
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        accounts: {
          create: {
            balance: 0,
          },
        },
      },
    });

    return { message: 'User registered', userId: user.id };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Both branches return the same message so the endpoint cannot be used to
    // discover which email addresses are registered.
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }

    const token = jwt.sign({ id: user.id, email: user.email }, secret, {
      // Stated explicitly so signing and verification cannot drift apart; the
      // guard verifies with `algorithms: ['HS256']`.
      algorithm: 'HS256',
      expiresIn: TOKEN_TTL,
    });

    return { message: 'Login successful', token };
  }
}
