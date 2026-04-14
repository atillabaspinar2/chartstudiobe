import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as z from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { McpService } from './mcp.service';

type TransportMap = Record<string, StreamableHTTPServerTransport>;

@Injectable()
export class McpProtocolService {
  private readonly transports: TransportMap = {};

  constructor(private readonly mcpService: McpService) {}

  async handlePost(req: IncomingMessage, res: ServerResponse, body: unknown) {
    const rawSessionId = (req.headers['mcp-session-id'] as string | undefined)
      ?.trim()
      .toLowerCase();
    const sessionId =
      rawSessionId && rawSessionId !== 'null' && rawSessionId !== 'undefined'
        ? (req.headers['mcp-session-id'] as string)
        : '';

    if (sessionId && this.transports[sessionId]) {
      await this.transports[sessionId].handleRequest(req, res, body);
      return;
    }

    const parsedBody =
      typeof body === 'string'
        ? (() => {
            try {
              return JSON.parse(body) as unknown;
            } catch {
              return body;
            }
          })()
        : body;

    const bodyMessages = Array.isArray(parsedBody) ? parsedBody : [parsedBody];
    const isInit = bodyMessages.some((m) => isInitializeRequest(m));

    // If the client sends an unknown/bogus session header during init, treat it as init anyway.
    if (isInit) {
      const newSessionId = randomUUID();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
      });

      const server = this.createServer();
      await server.connect(transport);

      this.transports[newSessionId] = transport;
      transport.onclose = () => {
        delete this.transports[newSessionId];
      };

      await transport.handleRequest(req, res, parsedBody);
      return;
    }

    // Not an init request and no valid session => reject.
    res.statusCode = sessionId ? 404 : 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: sessionId
            ? 'Not Found: Invalid session ID'
            : 'Bad Request: No valid session ID provided',
        },
        id: null,
      }),
    );
  }

  async handleGet(req: IncomingMessage, res: ServerResponse) {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !this.transports[sessionId]) {
      res.statusCode = 400;
      res.end('Invalid or missing session ID');
      return;
    }

    await this.transports[sessionId].handleRequest(req, res);
  }

  async handleDelete(req: IncomingMessage, res: ServerResponse) {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !this.transports[sessionId]) {
      res.statusCode = 400;
      res.end('Invalid or missing session ID');
      return;
    }

    await this.transports[sessionId].handleRequest(req, res);
  }

  private createServer() {
    const server = new McpServer({
      name: 'chartstudio-mcp',
      version: '0.0.1',
    });

    server.registerTool(
      'search_web',
      {
        title: 'Web search',
        description:
          'Search the public web and return raw results (title, url, snippet).',
        inputSchema: {
          q: z.string().min(2).max(200).describe('Search query'),
        },
      },
      async ({ q }) => {
        const result = await this.mcpService.searchWeb(q);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      },
    );

    return server;
  }
}
