import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { UsersService } from './users.service';

export interface JwtPayload {
  sub: number;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    fullName: string;
    email: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto): Promise<AuthResponse> {
    const passwordHash = await hash(signupDto.password, 12);
    const user = await this.usersService.create(
      signupDto.fullName,
      signupDto.email,
      passwordHash,
    );

    return this.createAuthResponse(user.id, user.fullName, user.email);
  }

  async signin(signinDto: SigninDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(signinDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await compare(signinDto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createAuthResponse(user.id, user.fullName, user.email);
  }

  async logout(userId: number): Promise<{ message: string; userId: number }> {
    return {
      message: 'Logged out successfully',
      userId,
    };
  }

  private async createAuthResponse(
    userId: number,
    fullName: string,
    email: string,
  ): Promise<AuthResponse> {
    const payload: JwtPayload = { sub: userId, email };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: userId,
        fullName,
        email,
      },
    };
  }
}
