import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type SearchWebResult = {
  title: string;
  url?: string;
  snippet?: string;
  source: 'serper' | 'wikipedia';
};

export type SearchWebResponse = {
  tool: 'search_web';
  query: string;
  providerUsed: 'serper' | 'wikipedia';
  fetchedAt: string;
  results: SearchWebResult[];
  raw?: unknown;
};

@Injectable()
export class McpService {
  constructor(private readonly configService: ConfigService) {}

  async searchWeb(query: string): Promise<SearchWebResponse> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return {
        tool: 'search_web',
        query: trimmed,
        providerUsed: 'wikipedia',
        fetchedAt: new Date().toISOString(),
        results: [],
      };
    }

    const serperKey = this.configService.get<string>('SERPER_API_KEY');

    if (serperKey) {
      try {
        const serper = await this.searchSerper(trimmed, serperKey);
        if (serper.results.length > 0) return serper;
        // If Serper returns no results, try Wikipedia as a fallback.
      } catch {
        // If Serper fails, fall back to Wikipedia.
      }
    }

    return await this.searchWikipedia(trimmed);
  }

  private async searchSerper(
    query: string,
    apiKey: string,
  ): Promise<SearchWebResponse> {
    const resp = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 10 }),
    });

    if (!resp.ok) {
      throw new ServiceUnavailableException('Serper search failed');
    }

    const json = await resp.json();
    const organic: any[] = Array.isArray(json?.organic) ? json.organic : [];

    const results: SearchWebResult[] = organic
      .map((r) => ({
        title: String(r?.title ?? ''),
        url: typeof r?.link === 'string' ? r.link : undefined,
        snippet: typeof r?.snippet === 'string' ? r.snippet : undefined,
        source: 'serper' as const,
      }))
      .filter((r) => r.title.length > 0);

    return {
      tool: 'search_web',
      query,
      providerUsed: 'serper',
      fetchedAt: new Date().toISOString(),
      results,
      raw: json,
    };
  }

  private async searchWikipedia(query: string): Promise<SearchWebResponse> {
    const userAgent = this.configService.get<string>('WIKIPEDIA_USER_AGENT');
    const url = new URL('https://en.wikipedia.org/w/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('list', 'search');
    url.searchParams.set('srsearch', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('utf8', '1');
    url.searchParams.set('srlimit', '8');

    const resp = await fetch(url.toString(), {
      headers: userAgent ? { 'User-Agent': userAgent } : undefined,
    });

    if (!resp.ok) {
      throw new ServiceUnavailableException('Wikipedia search failed');
    }

    const json = await resp.json();
    const search: any[] = Array.isArray(json?.query?.search)
      ? json.query.search
      : [];

    const results: SearchWebResult[] = search
      .map((r) => {
        const title = typeof r?.title === 'string' ? r.title : '';
        const pageid = r?.pageid;
        const snippet =
          typeof r?.snippet === 'string'
            ? // Wikipedia returns HTML-ish snippet; keep as raw-ish text.
              r.snippet.replace(/<[^>]*>/g, '')
            : undefined;
        const url = title
          ? `https://en.wikipedia.org/wiki/${encodeURIComponent(
              title.replace(/ /g, '_'),
            )}`
          : undefined;

        return {
          title,
          url,
          snippet,
          source: 'wikipedia' as const,
          pageid,
        } as SearchWebResult & { pageid?: unknown };
      })
      .filter((r) => r.title.length > 0);

    return {
      tool: 'search_web',
      query,
      providerUsed: 'wikipedia',
      fetchedAt: new Date().toISOString(),
      results,
      raw: json,
    };
  }
}
