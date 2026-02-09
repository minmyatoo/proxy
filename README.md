# NetSuite External URL Proxy

A simple Node.js proxy server for forwarding requests from NetSuite to external URLs.

## Quick Start

### Installation

```bash
cd proxy
npm install
```

### Running Locally

```bash
npm start
```

The server will start on `http://localhost:3000`

### Development Mode

```bash
npm run dev
```

## Usage

### Health Check

```bash
curl http://localhost:3000/health
```

### Proxy Request

```bash
POST http://localhost:3000/proxy?url=https://api.example.com/endpoint

Body:
{
  "key": "value"
}
```

## Features

- ✅ Forward requests to any external URL
- ✅ Automatic User-Agent header injection
- ✅ CORS enabled for NetSuite
- ✅ Request/response forwarding
- ✅ URL validation
- ✅ 30-second timeout protection

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `HOST` | localhost | Server host |
| `NODE_ENV` | development | Environment mode |

## NetSuite Integration

Use this proxy URL in your NetSuite scripts:

```
http://your-proxy-server:3000/proxy?url=YOUR_EXTERNAL_URL
```

### Example in NetSuite Script

```javascript
var externalUrl = 'https://api.example.com/endpoint';
var proxyUrl = 'http://proxy-server:3000/proxy?url=' + encodeURIComponent(externalUrl);

var response = nlapiRequestURL(proxyUrl, JSON.stringify({
  data: 'your request body'
}), null, 'POST');
```

## Deployment

This server can be deployed to:

- **Railway.app** - Recommended, free tier available
- **Heroku** - Classic option
- **AWS EC2** - Full control
- **Self-hosted server** - Any server with Node.js

### Production Considerations

⚠️ **Important:** Always use HTTPS in production!

- Set `NODE_ENV=production`
- Use environment variables for sensitive data
- Monitor server logs
- Set up proper error handling

## API Endpoints

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "service": "NetSuite External URL Proxy",
  "version": "1.0.0",
  "timestamp": "2026-02-09T10:00:00.000Z"
}
```

### POST /proxy?url=EXTERNAL_URL
Forward request to external URL

**Parameters:**
- `url` (required) - The external URL to proxy to

**Response:** Forwarded response from external URL

## License

MIT

## Author

Mike Min Myat Oo
