# Brat API Gabungan

Project ini adalah template Brat API image-only siap deploy ke GitHub + Vercel.

Isi project:

```txt
api/brat.js                  Endpoint generate PNG
api/index.js                 Info API JSON
public/index.html            Web tester + API tester + kode plugin bot
examples/plugin-brat-api.js  Plugin bot WhatsApp versi API
examples/timpa-banyak-frame.js Konsep frame banyak-banyak/timpa
brat-canvas/                 Package lokal dari ZIP brat-canvas
package.json                 Dependency Vercel
vercel.json                  Konfigurasi function
```

## Cara pakai web

Buka domain Vercel:

```txt
https://nama-project.vercel.app/
```

Di halaman web bisa:

- isi teks
- isi kode warna HEX
- preview gambar
- copy URL API
- copy kode fetch
- copy kode plugin bot

## Endpoint API

```txt
/api/brat?text=halo&color=ff0000
```

Style normal:

```txt
/api/brat?text=halo&color=ff0000
```

Hasil: background putih, teks merah.

Style2:

```txt
/api/brat?text=halo&color=ff0000&style2=1
```

Hasil: background merah, teks putih.

## Parameter

| Parameter | Fungsi |
|---|---|
| text | teks brat, wajib |
| color | kode warna HEX, contoh ff0000 atau #ff0000 |
| style2 | jika 1, warna jadi background dan teks putih |
| bg | custom background HEX, opsional |
| box | custom box HEX, opsional |
| w | width canvas, default 500 |
| h | height canvas, default 500 |
| blur | blur 0-10, default 0 |
| emojiStyle | apple/google/twitter/joypixels/blob |

## Deploy ke Vercel

1. Upload semua isi folder ini ke GitHub.
2. Buka Vercel.
3. Add New Project.
4. Import repository GitHub.
5. Framework preset boleh Other.
6. Build command kosongkan.
7. Deploy.

## Command plugin bot

```txt
.brat halo rafka
.brat2 halo rafka
.bratkode #ff0000 halo rafka
.bratkode2 #ff0000 halo rafka
```

## Catatan

Bratvid/video sengaja dihapus. Untuk konsep animasi/timpa, bot bisa memanggil `/api/brat` berkali-kali dengan teks bertahap, lalu penggabungan frame dilakukan di bot/VPS.
