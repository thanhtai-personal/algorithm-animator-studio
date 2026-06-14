import crypto from "node:crypto";
import zlib from "node:zlib";

export function createGradientPng(width: number, height: number, seedText: string) {
  const seed = crypto.createHash("sha1").update(seedText).digest().readUInt32BE(0);
  const raw = Buffer.alloc((width * 4 + 1) * height);
  let offset = 0;
  for (let y = 0; y < height; y += 1) {
    raw[offset++] = 0;
    for (let x = 0; x < width; x += 1) {
      const nx = x / Math.max(1, width - 1);
      const ny = y / Math.max(1, height - 1);
      raw[offset++] = Math.round(8 + (seed % 32) + nx * 24);
      raw[offset++] = Math.round(14 + ((seed >> 8) % 44) + ny * 32);
      raw[offset++] = Math.round(28 + ((seed >> 16) % 70) + (1 - nx) * 42);
      raw[offset++] = 255;
    }
  }
  return encodePng(width, height, raw);
}

function encodePng(width: number, height: number, raw: Buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const idat = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function chunk(type: string, data: Buffer) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
