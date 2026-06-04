import { bratGen } from 'brat-canvas';

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'Content-Type'
};

const ALLOWED_EMOJI_STYLES = new Set(['apple', 'google', 'twitter', 'joypixels', 'blob']);

function json(data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

function clampNumber(value, fallback, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function cleanHex(value, fallback = null) {
  if (value == null || value === '') return fallback;
  let color = String(value).trim();
  if (!color.startsWith('#')) color = `#${color}`;
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color)) return fallback;
  return color.toLowerCase();
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value == null) return false;
  const v = String(value).trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function readParamsFromUrl(request) {
  const url = new URL(request.url);
  const p = url.searchParams;
  return {
    text: p.get('text') || p.get('q') || '',
    color: p.get('color') || p.get('textColor') || p.get('warna') || '',
    bg: p.get('bg') || p.get('background') || '',
    box: p.get('box') || p.get('boxColor') || '',
    style2: p.get('style2') || p.get('invert') || p.get('filled') || '0',
    theme: p.get('theme') || 'brat',
    emojiStyle: p.get('emojiStyle') || p.get('emoji') || 'apple',
    w: p.get('w') || p.get('width'),
    h: p.get('h') || p.get('height'),
    blur: p.get('blur')
  };
}

async function readParamsFromJson(request) {
  try {
    const body = await request.json();
    return {
      text: body.text || body.q || '',
      color: body.color || body.textColor || body.warna || '',
      bg: body.bg || body.background || '',
      box: body.box || body.boxColor || '',
      style2: body.style2 || body.invert || body.filled || false,
      theme: body.theme || 'brat',
      emojiStyle: body.emojiStyle || body.emoji || 'apple',
      w: body.w || body.width,
      h: body.h || body.height,
      blur: body.blur
    };
  } catch {
    return null;
  }
}

function resolveColors(params) {
  const style2 = parseBoolean(params.style2);

  // Input utama warna cukup pakai kode HEX lewat color/warna.
  // Normal: background putih, teks mengikuti color.
  // Style2: background mengikuti color, teks putih.
  const kode = cleanHex(params.color, '#000000');
  const manualBg = cleanHex(params.bg);
  const manualBox = cleanHex(params.box);

  let bg = manualBg;
  let box = manualBox;
  let textColor;

  if (style2) {
    bg = bg || kode;
    box = box || bg;
    textColor = '#ffffff';
  } else {
    bg = bg || '#ffffff';
    box = box || bg;
    textColor = kode;
  }

  return { bg, box, textColor, kode, style2 };
}

async function renderBrat(params) {
  const text = String(params.text || '').trim();

  if (!text) {
    return json({
      status: false,
      message: 'Parameter text wajib diisi.',
      example: '/api/brat?text=halo&color=ff0000'
    }, 400);
  }

  if (text.length > 15000) {
    return json({ status: false, message: 'Text terlalu panjang. Maksimal 15.000 karakter.' }, 400);
  }

  const emojiStyleInput = String(params.emojiStyle || 'apple').toLowerCase();
  const emojiStyle = ALLOWED_EMOJI_STYLES.has(emojiStyleInput) ? emojiStyleInput : 'apple';
  const W = clampNumber(params.w, 500, 128, 1024);
  const H = clampNumber(params.h, 500, 128, 1024);
  const BLUR = clampNumber(params.blur, 0, 0, 10);

  const { bg, box, textColor, kode, style2 } = resolveColors(params);

  const options = {
    theme: String(params.theme || 'brat').trim().toLowerCase(),
    emojiStyle,
    W,
    H,
    BOX_W: W,
    BOX_H: H,
    BOX_PAD: 20,
    BLUR,
    C_BG: bg,
    C_BOX: box,
    C_TEXT: textColor
  };

  try {
    const buffer = await bratGen(text, options);
    return new Response(buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'content-type': 'image/png',
        'cache-control': 'public, max-age=86400',
        'content-disposition': 'inline; filename="brat.png"',
        'x-brat-color': kode,
        'x-brat-style2': String(style2)
      }
    });
  } catch (error) {
    return json({
      status: false,
      message: 'Gagal generate brat.',
      error: error?.message || String(error)
    }, 500);
  }
}

export async function GET(request) {
  return renderBrat(readParamsFromUrl(request));
}

export async function POST(request) {
  const params = await readParamsFromJson(request);
  if (!params) return json({ status: false, message: 'Body JSON tidak valid.' }, 400);
  return renderBrat(params);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
