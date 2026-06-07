// src/alyachanTools.js

import kunciapi from '../key/kunciapi.js';

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'Content-Type, Authorization, x-api-key, X-API-Key, X-Access-Key, apikey'
};

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: corsHeaders
  });
}

function joinUrl(base, path) {
  const cleanBase = String(base || '').replace(/\/+$/, '');
  const cleanPath = String(path || '').startsWith('/')
    ? String(path)
    : `/${String(path || '')}`;

  return `${cleanBase}${cleanPath}`;
}

function getAlyaKey() {
  return process.env.ALYA_API_KEY || kunciapi.alya || '';
}

function getAlyaBaseUrl() {
  return process.env.ALYA_BASE_URL || kunciapi.alyaBaseUrl || '';
}

function getProviderHeaders(apiKey, extraHeaders = {}) {
  const headers = {
    Accept: 'application/json, image/*, */*',
    'User-Agent': 'Mozilla/5.0',
    ...extraHeaders
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
    headers['X-API-Key'] = apiKey;
    headers['X-Access-Key'] = apiKey;
    headers['x-api-key'] = apiKey;
    headers.apikey = apiKey;
  }

  return headers;
}

function buildGetProviderUrl(baseUrl, providerPath, params = {}) {
  const providerUrl = new URL(joinUrl(baseUrl, providerPath));

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      providerUrl.searchParams.set(key, String(value));
    }
  }

  return providerUrl.toString();
}

async function proxyProviderResponse(providerRes, fileBase = 'result') {
  const contentType = providerRes.headers.get('content-type') || 'application/octet-stream';

  if (contentType.startsWith('image/')) {
    const buffer = await providerRes.arrayBuffer();

    const ext =
      contentType.includes('png') ? 'png' :
      contentType.includes('webp') ? 'webp' :
      contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' :
      'jpg';

    return new Response(buffer, {
      status: providerRes.status,
      headers: {
        ...corsHeaders,
        'content-type': contentType,
        'content-disposition': `inline; filename="${fileBase}.${ext}"`
      }
    });
  }

  if (contentType.includes('application/json')) {
    const data = await providerRes.json().catch(() => null);

    return json({
      status: providerRes.ok,
      providerStatus: providerRes.status,
      result: data
    }, providerRes.status);
  }

  const text = await providerRes.text().catch(() => '');

  return json({
    status: providerRes.ok,
    providerStatus: providerRes.status,
    result: text
  }, providerRes.status);
}

async function buildProviderBodyFromRequest(request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();

    return {
      body: form,
      headers: {}
    };
  }

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));

    return {
      body: JSON.stringify(body || {}),
      headers: {
        'content-type': 'application/json'
      }
    };
  }

  const body = await request.arrayBuffer();

  return {
    body,
    headers: {
      'content-type': contentType || 'application/octet-stream'
    }
  };
}

export function buildAlyachanImageToolHandler(config = {}) {
  const {
    providerPath = '',
    featureName = 'image-tool',
    fileBase = 'result',
    successMessage = 'Success'
  } = config;

  async function GET(request) {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url') || url.searchParams.get('image');

    if (!imageUrl) {
      return json({
        status: true,
        feature: featureName,
        message: `${featureName} backend aktif.`,
        note: 'Gunakan parameter ?url=link_gambar',
        usage: `${url.origin}${url.pathname}?url=https://example.com/image.jpg`,
        successMessage
      });
    }

    const alyaBaseUrl = getAlyaBaseUrl();
    const alyaKey = getAlyaKey();

    if (!alyaBaseUrl) {
      return json({
        status: false,
        message: 'alyaBaseUrl belum diisi di key/kunciapi.js'
      }, 500);
    }

    if (!alyaKey) {
      return json({
        status: false,
        message: 'alya API key belum diisi di key/kunciapi.js'
      }, 500);
    }

    try {
      // INI FIX UTAMANYA:
      // API Jagpro/Alya lama dipanggil pakai GET, bukan POST.
      const providerUrl = buildGetProviderUrl(alyaBaseUrl, providerPath, {
        url: imageUrl
      });

      const providerRes = await fetch(providerUrl, {
        method: 'GET',
        headers: getProviderHeaders(alyaKey)
      });

      return await proxyProviderResponse(providerRes, fileBase);

    } catch (error) {
      return json({
        status: false,
        feature: featureName,
        message: `Gagal menjalankan ${featureName}.`,
        error: error?.message || String(error)
      }, 500);
    }
  }

  async function POST(request) {
    const alyaBaseUrl = getAlyaBaseUrl();
    const alyaKey = getAlyaKey();

    if (!alyaBaseUrl) {
      return json({
        status: false,
        message: 'alyaBaseUrl belum diisi di key/kunciapi.js'
      }, 500);
    }

    if (!alyaKey) {
      return json({
        status: false,
        message: 'alya API key belum diisi di key/kunciapi.js'
      }, 500);
    }

    try {
      const contentType = request.headers.get('content-type') || '';

      // Kalau POST JSON berisi { url: "..." }, tetap lempar ke provider pakai GET.
      if (contentType.includes('application/json')) {
        const bodyJson = await request.json().catch(() => ({}));
        const imageUrl = bodyJson.url || bodyJson.image;

        if (imageUrl) {
          const providerUrl = buildGetProviderUrl(alyaBaseUrl, providerPath, {
            url: imageUrl
          });

          const providerRes = await fetch(providerUrl, {
            method: 'GET',
            headers: getProviderHeaders(alyaKey)
          });

          return await proxyProviderResponse(providerRes, fileBase);
        }
      }

      // Fallback kalau suatu saat provider lain memang butuh POST file.
      const { body, headers } = await buildProviderBodyFromRequest(request);

      const providerRes = await fetch(joinUrl(alyaBaseUrl, providerPath), {
        method: 'POST',
        headers: getProviderHeaders(alyaKey, headers),
        body
      });

      return await proxyProviderResponse(providerRes, fileBase);

    } catch (error) {
      return json({
        status: false,
        feature: featureName,
        message: `Gagal menjalankan ${featureName}.`,
        error: error?.message || String(error)
      }, 500);
    }
  }

  function OPTIONS() {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  return {
    GET,
    POST,
    OPTIONS
  };
}
