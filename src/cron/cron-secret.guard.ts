import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';

@Injectable()
export class CronSecretGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.get<string>('CRON_SECRET');
    if (!expected) {
      throw new ServiceUnavailableException('Cron is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers['x-cron-secret'];
    if (typeof provided !== 'string') {
      throw new UnauthorizedException('Missing cron secret');
    }

    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(provided, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid cron secret');
    }

    return true;
  }
}
