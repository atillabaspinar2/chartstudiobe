import { Module } from '@nestjs/common';
import { McpProtocolController } from './mcpProtocol.controller';
import { McpService } from './mcp.service';
import { McpRateLimitGuard } from './mcpRateLimit.guard';
import { McpProtocolService } from './mcpProtocol.service';

@Module({
  controllers: [McpProtocolController],
  providers: [McpService, McpProtocolService, McpRateLimitGuard],
})
export class McpModule {}
