// ✨ Plugin sticker - brat API image-only ✨
// Command:
// .brat teks
// .brat2 teks
// .bratkode #ff0000 teks
// .bratkode2 #ff0000 teks
//
// Versi ini TIDAK import brat-canvas di bot.
// Bot hanya request PNG dari API Vercel, lalu PNG diubah jadi sticker.

import { imageToWebp, addExif } from '../../function/events/exif.js';
import fs from 'fs';

// Ganti ke domain Vercel kamu.
// Bisa juga set di global: global.bratApi = 'https://nama-project.vercel.app'
const DEFAULT_BRAT_API = 'https://nama-project.vercel.app';

function cleanBaseUrl(url) {
  return String(url || DEFAULT_BRAT_API).replace(/\/$/, '');
}

function isHexColor(value) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(String(value || '').trim());
}

function removeHash(hex) {
  return String(hex || '#000000').replace('#', '');
}

function buildBratApiUrl({ apiBase, text, color, isStyle2 }) {
  const url = new URL('/api/brat', cleanBaseUrl(apiBase));
  url.searchParams.set('text', text);
  url.searchParams.set('color', removeHash(color));
  url.searchParams.set('emojiStyle', 'apple');
  url.searchParams.set('w', '500');
  url.searchParams.set('h', '500');
  url.searchParams.set('blur', '0');
  if (isStyle2) url.searchParams.set('style2', '1');
  return url.toString();
}

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `API error ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

let handler = async (m, { jagoanproject, args, text, usedPrefix, command }) => {
  const cmdLower = command.toLowerCase();
  const isKode = cmdLower.startsWith('bratkode');
  const isStyle2 = cmdLower.endsWith('2');

  let cleanText = text ? text : m.quoted?.text || m.quoted?.caption || m.quoted?.description || '';
  let color = '#000000';

  if (isKode) {
    if (!args[0] || !isHexColor(args[0])) {
      throw `*📝 CONTOH :*\n\n— ${usedPrefix + command} #ff0000 palak bapak kau`;
    }

    color = args[0].trim();
    cleanText = text.replace(args[0], '').trim();
    if (!cleanText) cleanText = m.quoted?.text || m.quoted?.caption || m.quoted?.description || '';
  }

  if (!cleanText) throw `*📝 CONTOH :*\n\n— ${usedPrefix + command} palak bapak kau`;
  if (cleanText.length > 15000) throw `*🚩 Teks terlalu panjang! Maksimal 15.000 karakter.*`;

  const packname = global.packname || 'Jagoan Project';
  const author = global.author || 'Mas Rafka';
  const errPic = fs.existsSync('./src/emror.webp') ? fs.readFileSync('./src/emror.webp') : null;

  try {
    await jagoanproject.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

    const apiUrl = buildBratApiUrl({
      apiBase: global.bratApi || DEFAULT_BRAT_API,
      text: cleanText,
      color,
      isStyle2
    });

    const pngBuffer = await fetchBuffer(apiUrl);
    const webpBuffer = await imageToWebp(pngBuffer);
    const finalSticker = await addExif(webpBuffer, packname, author);

    await jagoanproject.sendMessage(m.chat, { sticker: finalSticker }, { quoted: m });
    await jagoanproject.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
  } catch (e) {
    console.error('❌ Error plugin brat API:', e);
    const errorMessage = `❌ Terjadi kesalahan.\n\n*Log:* ${e.message || e}`;

    if (errPic) {
      try {
        await jagoanproject.sendFile(m.chat, errPic, 'error.webp', errorMessage, m);
      } catch {
        if (typeof m.reply === 'function') await m.reply(errorMessage);
      }
    } else {
      if (typeof m.reply === 'function') await m.reply(errorMessage);
    }

    await jagoanproject.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
  }
};

handler.help = ['brat <teks>', 'brat2 <teks>', 'bratkode #hex <teks>', 'bratkode2 #hex <teks>'];
handler.tags = ['sticker'];
handler.command = /^(brat|bratkode)(2)?$/i;
handler.register = true;
handler.limit = true;

export default handler;
