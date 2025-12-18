// Vercel Edge Middleware for dynamic meta tags
// This runs on Vercel Edge Runtime and intercepts bot requests

// Bot user agent patterns to detect crawlers
const BOT_PATTERNS = [
  'WhatsApp',
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'SkypeUriPreview',
  'Applebot',
  'Googlebot',
  'Bingbot',
  'Slurp',
  'DuckDuckBot',
  'Baiduspider',
  'YandexBot',
  'Sogou',
  'Exabot',
  'ia_archiver',
];

// Check if the request is from a bot/crawler
function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some(pattern => ua.includes(pattern.toLowerCase()));
}

// Extract form code from URL path
function extractFormCode(pathname: string): string | null {
  const match = pathname.match(/\/activity\/(\d+)\/registration/);
  return match ? match[1] : null;
}

// Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Generate HTML with meta tags for bots
function generateHTML(formData: { title: string; description?: string }, url: string): string {
  const title = formData.title || 'Paradize';
  const description = formData.description || '';
  
  // Generate HTML that matches the structure of index.html
  // Bots only care about meta tags, but we include the SPA structure
  // in case any bot executes JavaScript (though most don't)
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/paradize-logo.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    ${description ? `<meta name="description" content="${escapeHtml(description)}" />` : ''}
    <meta property="og:title" content="${escapeHtml(title)}" />
    ${description ? `<meta property="og:description" content="${escapeHtml(description)}" />` : ''}
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    ${description ? `<meta name="twitter:description" content="${escapeHtml(description)}" />` : ''}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
}

// Fetch form data from API
async function fetchFormData(code: string): Promise<{ title: string; description?: string } | null> {
  try {
    // Get API base URL from environment (required in production)
    const apiBaseUrl = process.env.VITE_API_BASE_URL;
    
    if (!apiBaseUrl) {
      console.error('VITE_API_BASE_URL environment variable is not set');
      return null;
    }
    
    const response = await fetch(`${apiBaseUrl}/forms/find-by-code?code=${encodeURIComponent(code)}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch form: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return {
      title: data.title || 'Paradize',
      description: data.description,
    };
  } catch (error) {
    console.error('Error fetching form data:', error);
    return null;
  }
}

// Vercel Edge Middleware entry point
export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const userAgent = request.headers.get('user-agent');

  // Only process registration pages - early return for other paths
  const formCode = extractFormCode(pathname);
  if (!formCode) {
    // Not a registration page, pass through to origin
    return fetch(request);
  }

  // Only intercept bot requests
  if (!isBot(userAgent)) {
    // Regular user, pass through to SPA
    return fetch(request);
  }

  // Bot detected - fetch form data and generate HTML
  const formData = await fetchFormData(formCode);
  const fullUrl = url.toString();
  const html = generateHTML(
    formData || { title: 'Paradize' },
    fullUrl
  );

  // Return HTML response for bots
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

