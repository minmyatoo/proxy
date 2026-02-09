#!/usr/bin/env node

/**
 * NetSuite External URL Proxy Server
 *
 * Simple Node.js server that proxies requests to external URLs
 * Used with NetSuite for accessing external APIs
 * Can be hosted on:
 * - Self-hosted server
 * - Railway.app
 * - Heroku
 * - AWS EC2
 *
 * Usage:
 * node server.js
 *
 * Environment Variables:
 * - PORT: Server port (default: 3000)
 * - NODE_ENV: production or development
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Simple request handler
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.writeHead(200).end();
  }

  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Health check endpoint
  if (pathname === '/health' || pathname === '/') {
    return res.writeHead(200).end(JSON.stringify({
      status: 'ok',
      service: 'NetSuite External URL Proxy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    }));
  }

  // Proxy endpoint
  if (pathname === '/proxy') {
    return handleProxy(req, res, parsedUrl);
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

/**
 * Main proxy handler
 */
function handleProxy(req, res, parsedUrl) {
  const targetUrl = parsedUrl.query.url;
  const method = req.method;

  if (!targetUrl) {
    res.writeHead(400);
    return res.end(JSON.stringify({
      error: 'Missing URL parameter',
      usage: 'POST /proxy?url=https://external-api-url',
      example: 'POST /proxy?url=https://api.example.com/endpoint',
    }));
  }

  // Validate URL format
  if (!isValidUrl(targetUrl)) {
    res.writeHead(400);
    return res.end(JSON.stringify({
      error: 'Invalid URL format',
      target: targetUrl,
    }));
  }

  console.log(`[${new Date().toISOString()}] ${method} ${targetUrl}`);

  // Collect request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    forwardRequest(req, res, targetUrl, method, body);
  });
}

/**
 * Forward request to external URL with proper headers
 */
function forwardRequest(originalReq, res, targetUrl, method, body) {
  try {
    const targetUrlObj = new URL(targetUrl);

    const options = {
      hostname: targetUrlObj.hostname,
      port: targetUrlObj.port,
      path: targetUrlObj.pathname + targetUrlObj.search,
      method: method,
      headers: {
        // Copy original headers
        ...originalReq.headers,
        // Add User-Agent header
        'User-Agent': 'NetSuite-Proxy/1.0.0 (Mozilla/5.0)',
        // Set correct hostname for target
        'host': targetUrlObj.hostname,
        // Remove proxy-specific headers
        'accept-encoding': 'gzip, deflate',
      },
      timeout: 30000,
    };

    console.log(`  → Forwarding to ${targetUrl}`);

    const protocol = targetUrlObj.protocol === 'https:' ? https : http;

    const proxyReq = protocol.request(options, (proxyRes) => {
      let responseBody = '';

      proxyRes.on('data', chunk => {
        responseBody += chunk.toString();
      });

      proxyRes.on('end', () => {
        console.log(`  ✓ Response ${proxyRes.statusCode} received`);

        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        res.end(responseBody);
      });
    });

    proxyReq.on('error', (error) => {
      console.error(`  ✗ Error: ${error.message}`);
      res.writeHead(502);
      res.end(JSON.stringify({
        error: 'Failed to reach external URL',
        message: error.message,
      }));
    });

    if (body) {
      proxyReq.write(body);
    }

    proxyReq.end();

  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.writeHead(500);
    res.end(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
    }));
  }
}

/**
 * Validate URL format
 */
function isValidUrl(targetUrl) {
  try {
    new URL(targetUrl);
    return true;
  } catch {
    return false;
  }
}

// Start server
server.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     NetSuite External URL Proxy Server                 ║
║     Request Forwarding for External APIs               ║
╚════════════════════════════════════════════════════════╝

✓ Server running at: http://${HOST}:${PORT}

📍 Health check:
   http://${HOST}:${PORT}/health

📍 Proxy endpoint:
   http://${HOST}:${PORT}/proxy?url=<EXTERNAL_URL>

🔗 Example usage:
   POST http://${HOST}:${PORT}/proxy?url=https://api.example.com/endpoint

💡 Features:
   • Proxies requests to any external URL
   • Automatically adds User-Agent header
   • CORS enabled for NetSuite access
   • Request/response forwarding
   • URL validation
   • 30-second timeout protection

📝 Use this URL in NetSuite as:
   custscript_proxy_url = http://${HOST}:${PORT}/proxy

⚠️  Remember to update to HTTPS when deployed to production!
`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = server;
