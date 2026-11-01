// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * Bounded 512 KiB block LRU cache over the Mortal Kombat: Deception (GQNE5D)
 * GameCube disc image (/mkd/game.iso) and decomp-built DOL (/mkd/main.dol)
 * backed by HTTP 206 Partial Content byte-range requests.
 */

export const GQNE5D_EXPECTED_GAME_ID = 'GQNE5D';
export const GQNE5D_ISO_SIZE = 1459978240;
export const GQNE5D_DOL_SIZE = 3843104;
export const GQNE5D_DOL_SHA1 = 'ef001212c6cd4da3194c041d24956a61bc5e9fcd';
export const GQNE5D_DOL_DISC_OFFSET = 0x20800;
export const GQNE5D_FST_DISC_OFFSET = 0x3cb300;
export const GQNE5D_FST_SIZE = 0x3ad7;

export function createHttpRangeFile(url, size, name = 'game.iso') {
  if (!url || !Number.isSafeInteger(size) || size <= 0) {
    throw Error('Invalid HTTP range file configuration.');
  }
  return {
    name,
    size,
    isHttpRange: true,
    url,
    slice(start, end) {
      const clampedStart = Math.max(0, start);
      const clampedEnd = Math.min(size, end);
      return {
        async arrayBuffer() {
          if (clampedEnd <= clampedStart) return new ArrayBuffer(0);
          const response = await fetch(url, {
            headers: { Range: `bytes=${clampedStart}-${clampedEnd - 1}` },
            cache: 'no-store',
          });
          if (response.status !== 206 && response.status !== 200) {
            throw Error(`HTTP ${response.status} reading range ${clampedStart}-${clampedEnd - 1}`);
          }
          const buf = await response.arrayBuffer();
          if (response.status === 200 && buf.byteLength > clampedEnd - clampedStart) {
            return buf.slice(clampedStart, clampedEnd);
          }
          return buf;
        },
      };
    },
  };
}

export function parseDolHeader(bytes) {
  if (!bytes || bytes.byteLength < 0x100) {
    throw Error('DOL header requires at least 256 bytes.');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const textSections = [];
  for (let i = 0; i < 7; i++) {
    const fileOffset = view.getUint32(i * 4, false);
    const loadAddr = view.getUint32(0x48 + i * 4, false);
    const size = view.getUint32(0x90 + i * 4, false);
    if (size > 0) textSections.push({ index: i, fileOffset, loadAddr, size });
  }
  const dataSections = [];
  for (let i = 0; i < 11; i++) {
    const fileOffset = view.getUint32(0x1c + i * 4, false);
    const loadAddr = view.getUint32(0x64 + i * 4, false);
    const size = view.getUint32(0xac + i * 4, false);
    if (size > 0) dataSections.push({ index: i, fileOffset, loadAddr, size });
  }
  const bssAddr = view.getUint32(0xd8, false);
  const bssSize = view.getUint32(0xdc, false);
  const entryPoint = view.getUint32(0xe0, false);
  return { textSections, dataSections, bssAddr, bssSize, entryPoint };
}

export function parseGameCubeHeaderAndFst(headerBytes, fstBytes) {
  if (!headerBytes || headerBytes.byteLength < 0x440) {
    throw Error('GameCube disc header requires at least 0x440 bytes.');
  }
  const decoder = new TextDecoder('ascii');
  const gameId = decoder.decode(headerBytes.subarray(0, 6));
  const hView = new DataView(headerBytes.buffer, headerBytes.byteOffset, headerBytes.byteLength);
  const magic = hView.getUint32(0x1c, false);
  let titleEnd = 0x20;
  while (titleEnd < 0x60 && headerBytes[titleEnd] !== 0) titleEnd++;
  const title = decoder.decode(headerBytes.subarray(0x20, titleEnd));
  const dolOffset = hView.getUint32(0x420, false);
  const fstOffset = hView.getUint32(0x424, false);
  const fstSize = hView.getUint32(0x428, false);

  let fstEntryCount = 0;
  const entries = [];
  if (fstBytes && fstBytes.byteLength >= 12) {
    const fView = new DataView(fstBytes.buffer, fstBytes.byteOffset, fstBytes.byteLength);
    fstEntryCount = fView.getUint32(8, false);
    const strTableOff = fstEntryCount * 12;
    const dirStack = [{ nextIndex: fstEntryCount, prefix: '' }];
    for (let i = 1; i < fstEntryCount && i * 12 + 12 <= fstBytes.byteLength; i++) {
      while (dirStack.length > 1 && i >= dirStack[dirStack.length - 1].nextIndex) {
        dirStack.pop();
      }
      const off = i * 12;
      const flagsAndName = fView.getUint32(off, false);
      const isDir = (flagsAndName >>> 24) & 0xff;
      const nameOff = flagsAndName & 0x00ffffff;
      const param1 = fView.getUint32(off + 4, false);
      const param2 = fView.getUint32(off + 8, false);
      let sEnd = strTableOff + nameOff;
      while (sEnd < fstBytes.byteLength && fstBytes[sEnd] !== 0) sEnd++;
      const name = decoder.decode(fstBytes.subarray(strTableOff + nameOff, sEnd));
      const fullPath = dirStack[dirStack.length - 1].prefix + name;
      if (isDir) {
        dirStack.push({ nextIndex: param2, prefix: fullPath + '/' });
      } else {
        entries.push({ index: i, path: fullPath, offset: param1, size: param2 });
      }
    }
  }
  return {
    gameId,
    magic,
    title,
    dolOffset,
    fstOffset,
    fstSize,
    fstEntryCount,
    entries,
  };
}

export function createDiscCache(file, { blockBytes = 512 * 1024, maxBytes = 32 * 1024 * 1024 } = {}) {
  if (!file || !Number.isSafeInteger(file.size) || blockBytes < 1 || maxBytes < blockBytes) {
    throw Error('Invalid disc cache configuration.');
  }
  const blocks = new Map();
  const pending = new Map();
  let bytes = 0;

  function touch(index, data) {
    blocks.delete(index);
    blocks.set(index, data);
  }

  async function fetchBlock(index) {
    if (pending.has(index)) return pending.get(index);
    const promise = (async () => {
      const start = index * blockBytes;
      const end = Math.min(start + blockBytes, file.size);
      const data = new Uint8Array(await file.slice(start, end).arrayBuffer());
      while (bytes + data.byteLength > maxBytes && blocks.size > 0) {
        const oldest = blocks.keys().next().value;
        bytes -= blocks.get(oldest).byteLength;
        blocks.delete(oldest);
      }
      blocks.set(index, data);
      bytes += data.byteLength;
      return data;
    })();
    pending.set(index, promise);
    try {
      return await promise;
    } finally {
      pending.delete(index);
    }
  }

  function copyFromBlocks(offset, size) {
    const end = Math.min(offset + size, file.size);
    const out = new Uint8Array(Math.max(0, end - offset));
    let written = 0;
    while (written < out.byteLength) {
      const pos = offset + written;
      const index = Math.floor(pos / blockBytes);
      const block = blocks.get(index);
      touch(index, block);
      const blockOffset = pos - index * blockBytes;
      const chunk = Math.min(out.byteLength - written, block.byteLength - blockOffset);
      out.set(block.subarray(blockOffset, blockOffset + chunk), written);
      written += chunk;
    }
    return out;
  }

  return {
    size: file.size,
    get residentBytes() {
      return bytes;
    },
    get residentBlocks() {
      return blocks.size;
    },
    read(offset, size) {
      if (offset >= file.size || size <= 0) return new Uint8Array(0);
      const first = Math.floor(offset / blockBytes);
      const last = Math.floor((Math.min(offset + size, file.size) - 1) / blockBytes);
      const missing = [];
      for (let index = first; index <= last; index++) {
        if (!blocks.has(index)) missing.push(index);
      }
      if (missing.length === 0) return copyFromBlocks(offset, size);
      return Promise.all(missing.map(fetchBlock)).then(() => copyFromBlocks(offset, size));
    },
  };
}
