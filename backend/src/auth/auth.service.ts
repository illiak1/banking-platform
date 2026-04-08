import { UnauthorizedException, BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(email: string, password: string) {
    // 1. Проверяем, есть ли уже пользователь
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // 2. Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Создаём пользователя
    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword },
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