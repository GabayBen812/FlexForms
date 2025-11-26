import axios from 'axios';

const FILENAME_REGEX = /filename\*?=(?:UTF-8'')?\"?([^\";]+)\"?/i;

const cleanFileName = (fileName?: string | null): string | null => {
  if (!fileName) return null;
  const trimmed = fileName.replace(/"/g, '').trim();
  if (!trimmed) return null;
  const decoded = decodeURIComponent(trimmed);
  return decoded.replace(/\.pdf$/i, '');
};

const extractFromDisposition = (disposition?: string): string | null => {
  if (!disposition) return null;
  const match = disposition.match(FILENAME_REGEX) || disposition.match(/filename="?([^";]+)"?/i);
  if (!match) return null;
  return cleanFileName(match[1]);
};

export async function fetchDocumentFileName(url: string): Promise<string | null> {
  const tryRequest = async (method: 'head' | 'get') => {
    try {
      const response =
        method === 'head'
          ? await axios.head(url)
          : await axios.get(url, { responseType: 'stream' });
      const disposition =
        response.headers['content-disposition'] || response.headers['Content-Disposition'];
      if (method === 'get') {
        // If we opened a stream, close it as we only need headers
        (response.data as any)?.destroy?.();
      }
      return extractFromDisposition(disposition);
    } catch {
      return null;
    }
  };

  // Try HEAD first to avoid downloading the file
  const headResult = await tryRequest('head');
  if (headResult) {
    return headResult;
  }

  // Fallback to GET (stream) if HEAD failed or headers were missing
  return tryRequest('get');
}


