import { UnauthorizedException, BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

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
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create user
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
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { message: 'Login successful', token };
  }
}