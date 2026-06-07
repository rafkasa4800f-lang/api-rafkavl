// src/alyachanTools.js

import kunciapi from '../key/kunciapi.js';

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'Content-Type, Authorization, x-api-key, apikey'
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

function addApiKeyToUrl(url, apiKey) {
  const u = new URL(url);

  // sengaja dibuat fleksibel karena tiap API kadang beda nama param
  if (apiKey) {
    u.searchParams.set('apikey', apiKey);
  }

  return u.toString();
}

function getProviderHeaders(apiKey, extraHeaders = {}) {
  const headers = {
    ...extraHeaders
  };

  if (apiKey) {
    // sengaja dikirim beberapa format agar cocok dengan banyak provider
    headers.Authorization = `Bearer ${apiKey}`;
    headers['x-api-key'] = apiKey;
    headers.apikey = apiKey;
  }

  return headers;
}

async function proxyProviderResponse(providerRes, fileBase = 'result') {
  const contentType = providerRes.headers.get('content-type') || 'application/octet-stream';

  // Kalau API lain mengembalikan gambar langsung
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

  // Kalau API lain mengembalikan JSON
  if (contentType.includes('application/json')) {
    const data = await providerRes.json().catch(() => null);

    return json({
      status: providerRes.ok,
      providerStatus: providerRes.status,
      result: data
    }, providerRes.status);
  }

  // Fallback
  const text = await providerRes.text().catch(() => '');

  return json({
    status: providerRes.ok,
    providerStatus: providerRes.status,
    result: text
  }, providerRes.status);
}

async function buildProviderBodyFromRequest(request) {
  const contentType = request.headers.get('content-type') || '';

  // Kalau bot kirim file pakai form-data
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();

    return {
      body: form,
      headers: {}
    };
  }

  // Kalau bot kirim JSON, contoh: { "url": "https://..." }
  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));

    return {
      body: JSON.stringify(body || {}),
      headers: {
        'content-type': 'application/json'
      }
    };
  }

  // Kalau raw buffer
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

    // GET untuk info kalau tidak ada url
    if (!imageUrl) {
      return json({
        status: true,
        feature: featureName,
        message: `${featureName} backend aktif.`,
        note: 'API ini adalah proxy backend. API key diambil dari key/kunciapi.js.',
        usage: {
          get: `${url.origin}${url.pathname}?url=https://example.com/image.jpg`,
          post_json: {
            url: 'https://example.com/image.jpg'
          },
          post_form: {
            image: 'upload file gambar'
          }
        },
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

    const providerUrlRaw = joinUrl(alyaBaseUrl, providerPath);
    const providerUrl = addApiKeyToUrl(providerUrlRaw, alyaKey);

    const providerRes = await fetch(providerUrl, {
      method: 'POST',
      headers: getProviderHeaders(alyaKey, {
        'content-type': 'application/json'
      }),
      body: JSON.stringify({
        url: imageUrl
      })
    });

    return await proxyProviderResponse(providerRes, fileBase);
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

    const providerUrlRaw = joinUrl(alyaBaseUrl, providerPath);
    const providerUrl = addApiKeyToUrl(providerUrlRaw, alyaKey);

    try {
      const { body, headers } = await buildProviderBodyFromRequest(request);

      const providerRes = await fetch(providerUrl, {
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
