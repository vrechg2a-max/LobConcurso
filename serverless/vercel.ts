// Polyfill browser globals required by pdf-parse / pdfjs-dist in Node.js serverless environments
if (typeof globalThis.DOMMatrix === 'undefined') {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m21 = 0; m22 = 1; m41 = 0; m42 = 0;
  };
}
if (typeof globalThis.ImageData === 'undefined') {
  (globalThis as any).ImageData = class ImageData {};
}
if (typeof globalThis.Path2D === 'undefined') {
  (globalThis as any).Path2D = class Path2D {};
}

// Suppress benign Node.js deprecation warnings (e.g. url.parse) that write to stderr and trigger false "[error]" tags in Vercel logs
if (typeof process !== 'undefined' && typeof process.on === 'function') {
  process.on('warning', (warning) => {
    if (warning.name === 'DeprecationWarning' && warning.message.includes('url.parse')) {
      return; // Ignore Express internal url.parse deprecation
    }
  });
}

import { app } from '../server';

// Serverless function configuration for Vercel
export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default function handler(req: any, res: any) {
  try {
    // Enable CORS for Vercel deployments
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }

    // If Vercel parsed body as string, ensure it is parsed as object for Express
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch (_) {}
    }

    const rawUrl = req.url || '';
    let targetPath = '';

    // Check if query parameter has __path or path
    try {
      const parsed = new URL(rawUrl, 'http://localhost');
      const paramPath = parsed.searchParams.get('__path') || parsed.searchParams.get('path');
      if (paramPath) {
        targetPath = `/api/${paramPath.replace(/^\/+/, '')}`;
        // Preserve other query parameters
        parsed.searchParams.delete('__path');
        parsed.searchParams.delete('path');
        const remainingQuery = parsed.searchParams.toString();
        if (remainingQuery) {
          targetPath += `?${remainingQuery}`;
        }
      }
    } catch {
      // Fall back to header inspection
    }

    if (!targetPath) {
      const forwardedUri =
        req.headers['x-forwarded-uri'] ||
        req.headers['x-matched-path'] ||
        req.headers['x-now-route-matches'];

      if (typeof forwardedUri === 'string' && forwardedUri.startsWith('/api')) {
        const queryIdx = rawUrl.indexOf('?');
        const queryStr = queryIdx !== -1 ? rawUrl.slice(queryIdx) : '';
        targetPath = `${forwardedUri.split('?')[0]}${queryStr}`;
      } else if (rawUrl && !rawUrl.startsWith('/api')) {
        targetPath = `/api${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
      } else {
        targetPath = rawUrl;
      }
    }

    req.url = targetPath;

    return (app as any)(req, res);
  } catch (err: any) {
    console.error('Serverless function error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: err?.message || 'Erro interno na função serverless.',
        })
      );
    }
  }
}
