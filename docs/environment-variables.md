# Environment Variables

This document describes all environment variables used across the Paradize platform.

## Client (Web Application)

### `VITE_API_BASE_URL` (Required in Production)

**Description**: The base URL for the backend API server

**Usage**:
- **Development**: Defaults to `http://localhost:3101` if not set
- **Production**: **MUST be explicitly set** to your production API URL

**Examples**:
```bash
# Development
VITE_API_BASE_URL=http://localhost:3101

# Production
VITE_API_BASE_URL=https://api.paradize.com
```

**Setup Instructions**:

#### Local Development
1. Create a `.env.local` file in the `Client/` directory (optional, has default)
2. Add: `VITE_API_BASE_URL=http://localhost:3101`

#### Production Deployment

**Vercel**:
1. Go to project Settings → Environment Variables
2. Add variable: `VITE_API_BASE_URL` = `https://your-api-url.com`
3. Select "Production" environment
4. Redeploy your application

**Netlify**:
1. Go to Site settings → Environment variables
2. Add variable: `VITE_API_BASE_URL` = `https://your-api-url.com`
3. Redeploy your application

**Railway**:
1. Go to your service → Variables tab
2. Add variable: `VITE_API_BASE_URL` = `https://your-api-url.com`
3. Redeploy triggers automatically

**Important Notes**:
- Environment variables with `VITE_` prefix are embedded at **build time**, not runtime
- You **must rebuild/redeploy** after changing environment variables
- In production, the application will throw an error if `VITE_API_BASE_URL` is not set

---

## Server (Backend Application)

### Coming Soon
Add server environment variables documentation here.

---

## Mobile Application

### Coming Soon
Add mobile environment variables documentation here.

