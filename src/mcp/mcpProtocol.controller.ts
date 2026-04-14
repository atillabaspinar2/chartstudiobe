import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { McpProtocolService } from './mcpProtocol.service';
import { McpRateLimitGuard } from './mcpRateLimit.guard';

@Controller('mcp')
@UseGuards(McpRateLimitGuard)
export class McpProtocolController {
  constructor(private readonly mcpProtocolService: McpProtocolService) {}

  @Post()
  async post(@Req() req: Request, @Res() res: Response, @Body() body: unknown) {
    await this.mcpProtocolService.handlePost(req, res, body);
  }

  @Get()
  async get(@Req() req: Request, @Res() res: Response) {
    await this.mcpProtocolService.handleGet(req, res);
  }

  @Delete()
  async del(@Req() req: Request, @Res() res: Response) {
    await this.mcpProtocolService.handleDelete(req, res);
  }
}
