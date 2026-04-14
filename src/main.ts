import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    // MCP Streamable HTTP relies on these headers being readable by browsers.
    exposedHeaders: ['Mcp-Session-Id', 'mcp-session-id'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Mcp-Session-Id',
      'mcp-session-id',
      'Mcp-Protocol-Version',
      'mcp-protocol-version',
      'Last-Event-ID',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
