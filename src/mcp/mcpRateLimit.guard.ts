import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

type RateWindow = { windowStartMs: number; count: number };

@Injectable()
export class McpRateLimitGuard implements CanActivate {
  private readonly windowsByKey = new Map<string, RateWindow>();

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const key = this.getClientKey(req);

    const windowMs = this.getInt('MCP_RATE_WINDOW_MS', 60_000);
    const limit = this.getInt('MCP_RATE_LIMIT', 60);

    const now = Date.now();
    const existing = this.windowsByKey.get(key);

    if (!existing || now - existing.windowStartMs >= windowMs) {
      this.windowsByKey.set(key, { windowStartMs: now, count: 1 });
      return true;
    }

    if (existing.count >= limit) {
      throw new HttpException(
        'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    existing.count += 1;
    return true;
  }

  private getInt(name: string, fallback: number): number {
    const raw = this.configService.get<string | number | undefined>(name);
    const value =
      typeof raw === 'number'
        ? raw
        : typeof raw === 'string'
          ? Number(raw)
          : NaN;

    return Number.isFinite(value) ? Math.floor(value) : fallback;
  }

  private getClientKey(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    const forwardedForFirst =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : Array.isArray(forwardedFor)
          ? forwardedFor[0]?.split(',')[0]?.trim()
          : undefined;

    const ip = forwardedForFirst || req.ip || 'unknown';
    const ua = req.headers['user-agent'] || 'unknown';
    return `${ip}::${ua}`;
  }
}
