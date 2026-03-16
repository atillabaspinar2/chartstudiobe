import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StringValue } from 'ms';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtExpiresIn = configService.get<string>('JWT_EXPIRES_IN', '1d');

        return {
          secret: configService.get<string>(
            'JWT_SECRET',
            'change-me-in-production',
          ),
          signOptions: {
            expiresIn: jwtExpiresIn as StringValue,
          },
        };
      },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, AuthService, JwtAuthGuard],
})
export class UsersModule {}
