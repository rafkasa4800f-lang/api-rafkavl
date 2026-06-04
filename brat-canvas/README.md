# brat-canvas — Image Only Local Package

Package lokal untuk generate gambar brat PNG dengan emoji support.

Video/bratvid sengaja dihapus dari template API ini agar project lebih ringan untuk Vercel.

## Usage

```js
import { bratGen } from 'brat-canvas';

const buffer = await bratGen('halo rafka', {
  theme: 'brat',
  W: 500,
  H: 500
});
```
