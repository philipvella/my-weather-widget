'use strict';

/**
 * Generates public/favicon.ico (16×16 + 32×32) from scratch using pure Node.js.
 * Matches the SVG design in public/favicon.svg.
 * Run via: node scripts/generate-favicon.cjs
 */

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '../public/favicon.ico');

// ---------------------------------------------------------------------------
// Pixel generator — matches the SVG design
// ---------------------------------------------------------------------------

function getColor(x, y, w, h) {
  // Normalise to [-1, 1] with pixel-centre sampling
  const nx = (x - w / 2 + 0.5) / (w / 2);
  const ny = (y - h / 2 + 0.5) / (h / 2);

  // Transparent outside bounding circle
  if (nx * nx + ny * ny > 1.02) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // Sun — top-right, amber
  const sunCx = 0.31;
  const sunCy = -0.25;
  const sunR = 0.34;
  if ((nx - sunCx) ** 2 + (ny - sunCy) ** 2 < sunR * sunR) {
    return { r: 251, g: 191, b: 36, a: 255 };
  }

  // Cloud — three overlapping circles, slate-50
  const cloudParts = [
    { cx: -0.37, cy: 0.38, r: 0.26 },
    { cx: -0.09, cy: 0.25, r: 0.33 },
    { cx: 0.22, cy: 0.38, r: 0.26 },
  ];
  for (const c of cloudParts) {
    if ((nx - c.cx) ** 2 + (ny - c.cy) ** 2 < c.r * c.r) {
      return { r: 241, g: 245, b: 249, a: 255 };
    }
  }
  // Cloud base rectangle
  if (nx >= -0.65 && nx <= 0.5 && ny >= 0.38 && ny <= 0.65) {
    return { r: 241, g: 245, b: 249, a: 255 };
  }

  // Slate background (#475569)
  return { r: 71, g: 85, b: 105, a: 255 };
}

// ---------------------------------------------------------------------------
// ICO binary builder
// ---------------------------------------------------------------------------

function buildIcoImage(width, height) {
  // Collect pixels
  const pixels = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      pixels.push(getColor(x, y, width, height));
    }
  }

  const bmpHeaderSize = 40;
  const pixelDataSize = width * height * 4;
  const andRowBytes = Math.ceil(width / 32) * 4;
  const andMaskSize = andRowBytes * height;
  const totalSize = bmpHeaderSize + pixelDataSize + andMaskSize;

  const buf = Buffer.alloc(totalSize, 0);
  let o = 0;

  // BITMAPINFOHEADER
  buf.writeUInt32LE(40, o);
  o += 4; // biSize
  buf.writeInt32LE(width, o);
  o += 4; // biWidth
  buf.writeInt32LE(height * 2, o);
  o += 4; // biHeight (doubled: XOR + AND)
  buf.writeUInt16LE(1, o);
  o += 2; // biPlanes
  buf.writeUInt16LE(32, o);
  o += 2; // biBitCount
  buf.writeUInt32LE(0, o);
  o += 4; // biCompression
  buf.writeUInt32LE(0, o);
  o += 4; // biSizeImage
  buf.writeInt32LE(0, o);
  o += 4; // biXPelsPerMeter
  buf.writeInt32LE(0, o);
  o += 4; // biYPelsPerMeter
  buf.writeUInt32LE(0, o);
  o += 4; // biClrUsed
  buf.writeUInt32LE(0, o);
  o += 4; // biClrImportant

  // Pixel data — BGRA, bottom-to-top
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const p = pixels[y * width + x];
      buf.writeUInt8(p.b, o++);
      buf.writeUInt8(p.g, o++);
      buf.writeUInt8(p.r, o++);
      buf.writeUInt8(p.a, o++);
    }
  }

  // AND mask — all zeros (alpha channel handles transparency)
  // buf already zero-initialised

  return { data: buf, size: totalSize };
}

function buildIco(sizes) {
  const images = sizes.map(([w, h]) => buildIcoImage(w, h));

  const headerSize = 6;
  const dirEntrySize = 16;
  const totalSize =
    headerSize + dirEntrySize * sizes.length + images.reduce((s, img) => s + img.size, 0);

  const buf = Buffer.alloc(totalSize);
  let o = 0;

  // ICONDIR header
  buf.writeUInt16LE(0, o);
  o += 2; // reserved
  buf.writeUInt16LE(1, o);
  o += 2; // type = 1 (ICO)
  buf.writeUInt16LE(sizes.length, o);
  o += 2; // count

  // Directory entries
  let imageOffset = headerSize + dirEntrySize * sizes.length;
  for (let i = 0; i < sizes.length; i++) {
    const [w, h] = sizes[i];
    buf.writeUInt8(w === 256 ? 0 : w, o++);
    buf.writeUInt8(h === 256 ? 0 : h, o++);
    buf.writeUInt8(0, o++); // colorCount
    buf.writeUInt8(0, o++); // reserved
    buf.writeUInt16LE(1, o);
    o += 2; // planes
    buf.writeUInt16LE(32, o);
    o += 2; // bpp
    buf.writeUInt32LE(images[i].size, o);
    o += 4; // bytesInRes
    buf.writeUInt32LE(imageOffset, o);
    o += 4; // imageOffset
    imageOffset += images[i].size;
  }

  // Image data
  for (const img of images) {
    img.data.copy(buf, o);
    o += img.size;
  }

  return buf;
}

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const ico = buildIco([
  [16, 16],
  [32, 32],
]);
fs.writeFileSync(OUT, ico);
console.log(`[favicon] ${ico.length} bytes → ${path.relative(process.cwd(), OUT)}`);
