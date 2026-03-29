import { Controller, Post, UseGuards } from '@nestjs/common';
import { CronSecretGuard } from './cron-secret.guard';

@Controller('cron')
export class CronController {
  /**
   * Called on a schedule by cron-job.org (or similar) with header:
   * X-Cron-Secret: <CRON_SECRET>
   * Add recurring work here or delegate to a service.
   */
  @Post('tick')
  @UseGuards(CronSecretGuard)
  tick(): { ok: true } {
    return { ok: true };
  }
}
