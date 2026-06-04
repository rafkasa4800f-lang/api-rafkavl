const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'Content-Type'
};

export function GET(request) {
  const baseUrl = new URL(request.url).origin;

  return Response.json({
    status: true,
    name: 'Brat API Gabungan',
    type: 'image-only',
    note: 'Web + API + tester + contoh kode plugin bot dalam satu project. Bratvid/video dihapus.',
    web: baseUrl,
    endpoint: `${baseUrl}/api/brat`,
    examples: {
      default: `${baseUrl}/api/brat?text=halo%20rafka`,
      customColor: `${baseUrl}/api/brat?text=halo%20rafka&color=ff0000`,
      style2: `${baseUrl}/api/brat?text=halo%20rafka&color=b266ff&style2=1`
    },
    params: {
      text: 'wajib, isi teks brat',
      color: 'opsional kode HEX tanpa atau dengan #, contoh ff0000 / #ff0000',
      style2: 'opsional 1/true. Jika aktif: background pakai color, teks putih',
      bg: 'opsional custom background HEX',
      box: 'opsional custom box HEX',
      w: 'opsional width 128-1024, default 500',
      h: 'opsional height 128-1024, default 500',
      blur: 'opsional angka 0-10, default 0',
      emojiStyle: 'opsional apple/google/twitter/joypixels/blob'
    }
  }, { headers: corsHeaders });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
