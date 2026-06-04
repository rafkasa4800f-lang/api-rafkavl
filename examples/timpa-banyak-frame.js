// Konsep timpa/banyak-banyak:
// API Vercel cuma bikin PNG. Penggabungan jadi gif/webp/video dilakukan di bot/VPS.
// Contoh ini membuat URL frame bertahap per kata.

const API_BASE = 'https://nama-project.vercel.app';
const teks = 'aku suka kamu banget';
const warna = '#b266ff';
const style2 = false;

const words = teks.split(/\s+/);
const frameUrls = [];

for (let i = 1; i <= words.length; i++) {
  const partialText = words.slice(0, i).join(' ');
  const url = new URL('/api/brat', API_BASE);
  url.searchParams.set('text', partialText);
  url.searchParams.set('color', warna.replace('#', ''));
  if (style2) url.searchParams.set('style2', '1');
  frameUrls.push(url.toString());
}

console.log(frameUrls);
