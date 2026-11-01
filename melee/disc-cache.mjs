// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * Bounded 512 KiB block LRU cache over a GameCube disc image (a File, Blob,
 * or an HTTP 206 byte-range-backed virtual file).
 *
 * read(offset, size) returns a Uint8Array synchronously when every block is
 * resident in the 32 MiB LRU cache, so a hit never suspends the WebAssembly
 * module via Asyncify, and returns a Promise<Uint8Array> otherwise.
 *
 * Also normalizes byte 0x07 (disc_version) of GALE01 rev 0 (v1.00) headers to
 * rev 2 (v1.02) so aurora_dvd_open accepts GALE01 v1.00 and v1.02 images alike.
 */

export function normalizeGale01HeaderBlock(blockIndex, data) {
  if (blockIndex === 0 && data && data.length >= 32) {
    // 'G','A','L','E','0','1' at 0..5 and GameCube magic 0xC2339F3D at 0x1C..0x1F
    if (
      data[0] === 0x47 &&
      data[1] === 0x41 &&
      data[2] === 0x4c &&
      data[3] === 0x45 &&
      data[4] === 0x30 &&
      data[5] === 0x31 &&
      data[0x1c] === 0xc2 &&
      data[0x1d] === 0x33 &&
      data[0x1e] === 0x9f &&
      data[0x1f] === 0x3d &&
      data[7] !== 2
    ) {
      data[7] = 2;
    }
  }
  return data;
}

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
            throw Error(`HTTP ${response.status} reading disc range ${clampedStart}-${clampedEnd - 1}`);
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

export const GALE01_FST_OFFSET = 0x453400;
export const GALE01_FST_LENGTH = 0x7529;
export const GALE01_VIRTUAL_OVERLAY_BASE = 0x58000000;
export const GALE01_VIRTUAL_OVERLAY_STRIDE = 0x01000000;

export function patchFstBufferWithOverlays(fstBytes, overlays) {
  const patched = new Uint8Array(fstBytes.length);
  patched.set(fstBytes);
  if (patched.length < 12) return { patched, patchedEntries: [] };

  const view = new DataView(patched.buffer, patched.byteOffset, patched.byteLength);
  const numEntries = view.getUint32(8, false);
  const strTableOffset = numEntries * 12;
  if (strTableOffset > patched.length) return { patched, patchedEntries: [] };

  const nameToOverlay = new Map();
  for (const ov of overlays) {
    for (const name of ov.fstFileNames) {
      nameToOverlay.set(name.toLowerCase(), ov);
    }
  }

  const decoder = new TextDecoder('ascii');
  const patchedEntries = [];
  for (let i = 1; i < numEntries; i++) {
    const entryOff = i * 12;
    const flagsAndName = view.getUint32(entryOff, false);
    const isDir = (flagsAndName >>> 24) & 0xff;
    if (isDir !== 0) continue;
    const nameOff = flagsAndName & 0x00ffffff;
    const absStrOff = strTableOffset + nameOff;
    if (absStrOff >= patched.length) continue;
    let endStr = absStrOff;
    while (endStr < patched.length && patched[endStr] !== 0) endStr++;
    const fileName = decoder.decode(patched.subarray(absStrOff, endStr));
    const ov = nameToOverlay.get(fileName.toLowerCase());
    if (ov) {
      const origOffset = view.getUint32(entryOff + 4, false);
      const origLength = view.getUint32(entryOff + 8, false);
      view.setUint32(entryOff + 4, ov.virtualOffset >>> 0, false);
      view.setUint32(entryOff + 8, ov.byteLength >>> 0, false);
      patchedEntries.push({
        entryIndex: i,
        fileName,
        origOffset,
        origLength,
        virtualOffset: ov.virtualOffset >>> 0,
        byteLength: ov.byteLength >>> 0,
      });
    }
  }
  return { patched, patchedEntries };
}

export function createDiscCache(file, { blockBytes = 512 * 1024, maxBytes = 32 * 1024 * 1024 } = {}) {
  if (!file || !Number.isSafeInteger(file.size) || blockBytes < 1 || maxBytes < blockBytes) {
    throw Error('Invalid disc cache configuration.');
  }
  const physicalFileSize = file.size;
  let virtualDiscSize = physicalFileSize;
  const blocks = new Map(); // insertion order doubles as LRU order
  const pending = new Map(); // concurrent misses on one block share a read
  let bytes = 0;

  // Virtual FST & Disc Overlay state
  const overlays = []; // [{ slotIndex, fstFileNames, virtualOffset, byteLength, data }]
  let rawFstBytes = null;
  let patchedFstBytes = null;
  let patchedFstEntries = [];
  const overlayStats = {
    overlayReadHits: 0,
    overlayBytesRead: 0,
    fstReadHits: 0,
    lastOverlayReadOffset: null,
    lastOverlayReadLength: 0,
  };

  function syncFileVirtualSize(newSize) {
    virtualDiscSize = Math.max(physicalFileSize, newSize);
    try {
      Object.defineProperty(file, 'size', {
        value: virtualDiscSize,
        writable: true,
        configurable: true,
      });
    } catch (_) {
      // Native File/Blob instances may have a getter-only size on prototype;
      // define own property on the instance so file.size returns virtualDiscSize.
    }
  }

  function rebuildPatchedFstAndInjectIntoCache() {
    if (!rawFstBytes) return;
    if (overlays.length === 0) {
      patchedFstBytes = new Uint8Array(rawFstBytes);
      patchedFstEntries = [];
    } else {
      const res = patchFstBufferWithOverlays(rawFstBytes, overlays);
      patchedFstBytes = res.patched;
      patchedFstEntries = res.patchedEntries;
    }
    // Also update any resident block in `blocks` that overlaps GALE01_FST_OFFSET..END
    const fstEnd = GALE01_FST_OFFSET + GALE01_FST_LENGTH;
    const firstBlock = Math.floor(GALE01_FST_OFFSET / blockBytes);
    const lastBlock = Math.floor((fstEnd - 1) / blockBytes);
    for (let b = firstBlock; b <= lastBlock; b++) {
      const blk = blocks.get(b);
      if (blk) {
        const blkStart = b * blockBytes;
        const blkEnd = blkStart + blk.length;
        const ovStart = Math.max(blkStart, GALE01_FST_OFFSET);
        const ovEnd = Math.min(blkEnd, fstEnd);
        if (ovEnd > ovStart) {
          blk.set(
            patchedFstBytes.subarray(ovStart - GALE01_FST_OFFSET, ovEnd - GALE01_FST_OFFSET),
            ovStart - blkStart
          );
        }
      }
    }
  }

  async function ensureRawFstLoaded() {
    if (rawFstBytes) return rawFstBytes;
    const sliceBuf = await file.slice(
      GALE01_FST_OFFSET,
      Math.min(physicalFileSize, GALE01_FST_OFFSET + GALE01_FST_LENGTH)
    ).arrayBuffer();
    rawFstBytes = new Uint8Array(sliceBuf);
    rebuildPatchedFstAndInjectIntoCache();
    return rawFstBytes;
  }

  async function registerDiscOverlay(fstFileNames, bufferOrUint8) {
    const names = Array.isArray(fstFileNames) ? fstFileNames.slice() : [String(fstFileNames)];
    const data =
      bufferOrUint8 instanceof Uint8Array
        ? bufferOrUint8
        : new Uint8Array(bufferOrUint8);
    if (!names.length || data.byteLength === 0) {
      throw Error('registerDiscOverlay requires non-empty fstFileNames and data buffer.');
    }
    const slotIndex = overlays.length;
    const virtualOffset = (GALE01_VIRTUAL_OVERLAY_BASE + slotIndex * GALE01_VIRTUAL_OVERLAY_STRIDE) >>> 0;
    const entry = {
      slotIndex,
      fstFileNames: names,
      virtualOffset,
      byteLength: data.byteLength >>> 0,
      data,
    };
    overlays.push(entry);
    syncFileVirtualSize(virtualOffset + data.byteLength + 0x100000);
    await ensureRawFstLoaded();
    rebuildPatchedFstAndInjectIntoCache();
    return {
      slotIndex,
      virtualOffset,
      byteLength: data.byteLength,
      fstFileNames: names,
      patchedEntries: patchedFstEntries.slice(),
    };
  }

  function clearDiscOverlays() {
    overlays.length = 0;
    syncFileVirtualSize(physicalFileSize);
    rebuildPatchedFstAndInjectIntoCache();
  }

  function touch(index, data) {
    blocks.delete(index);
    blocks.set(index, data);
  }

  async function fetchBlock(index) {
    if (pending.has(index)) return pending.get(index);
    const promise = (async () => {
      const start = index * blockBytes;
      const end = Math.min(start + blockBytes, physicalFileSize);
      const data = normalizeGale01HeaderBlock(
        index,
        new Uint8Array(await file.slice(start, end).arrayBuffer())
      );
      if (data.length !== end - start) throw Error('Short disc read.');
      // If patched FST is active and overlaps this block, apply it in-place before caching
      if (patchedFstBytes && overlays.length > 0) {
        const fstEnd = GALE01_FST_OFFSET + patchedFstBytes.length;
        const ovStart = Math.max(start, GALE01_FST_OFFSET);
        const ovEnd = Math.min(end, fstEnd);
        if (ovEnd > ovStart) {
          data.set(
            patchedFstBytes.subarray(ovStart - GALE01_FST_OFFSET, ovEnd - GALE01_FST_OFFSET),
            ovStart - start
          );
        }
      }
      touch(index, data);
      bytes += data.length;
      while (bytes > maxBytes) {
        const [oldest, evicted] = blocks.entries().next().value;
        blocks.delete(oldest);
        bytes -= evicted.length;
      }
      return data;
    })();
    pending.set(index, promise);
    try {
      return await promise;
    } finally {
      pending.delete(index);
    }
  }

  function read(offset, size) {
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isSafeInteger(size) ||
      offset < 0 ||
      size < 0 ||
      offset + size > virtualDiscSize
    ) {
      throw Error('Disc read is out of bounds.');
    }
    if (!size) return new Uint8Array();

    // Check virtual overlay slots (synchronous zero-Asyncify path)
    if (offset >= GALE01_VIRTUAL_OVERLAY_BASE) {
      for (let i = 0; i < overlays.length; i++) {
        const ov = overlays[i];
        const ovEnd = ov.virtualOffset + ov.byteLength;
        if (offset >= ov.virtualOffset && offset < ovEnd) {
          const relStart = offset - ov.virtualOffset;
          const relEnd = Math.min(ov.byteLength, relStart + size);
          overlayStats.overlayReadHits += 1;
          overlayStats.overlayBytesRead += relEnd - relStart;
          overlayStats.lastOverlayReadOffset = offset;
          overlayStats.lastOverlayReadLength = size;
          if (relEnd - relStart === size) {
            return ov.data.subarray(relStart, relEnd);
          }
          const padded = new Uint8Array(size);
          padded.set(ov.data.subarray(relStart, relEnd), 0);
          return padded;
        }
      }
      throw Error(`Unmapped virtual overlay disc read at 0x${offset.toString(16)} (${size} bytes)`);
    }

    // Check if read overlaps patched FST region (even partially or across 512 KiB blocks)
    if (patchedFstBytes && overlays.length > 0) {
      const fstEnd = GALE01_FST_OFFSET + patchedFstBytes.length;
      if (offset < fstEnd && offset + size > GALE01_FST_OFFSET) {
        overlayStats.fstReadHits += 1;
        if (offset >= GALE01_FST_OFFSET && offset + size <= fstEnd) {
          const relStart = offset - GALE01_FST_OFFSET;
          return patchedFstBytes.subarray(relStart, relStart + size);
        }
      }
    }

    if (offset + size > physicalFileSize) {
      throw Error('Disc read is out of physical bounds.');
    }

    const first = Math.floor(offset / blockBytes);
    const last = Math.floor((offset + size - 1) / blockBytes);
    const pieces = [];
    let missing = false;
    for (let index = first; index <= last; index++) {
      const data = blocks.get(index);
      if (data) {
        touch(index, data);
        pieces.push(data);
      } else {
        missing = true;
        pieces.push(fetchBlock(index));
      }
    }
    const combine = (values) => {
      const skip = offset - first * blockBytes;
      let result;
      if (first === last) {
        result = values[0].subarray(skip, skip + size);
      } else {
        result = new Uint8Array(size);
        let written = 0;
        values.forEach((data, i) => {
          const start = i === 0 ? skip : 0;
          const n = Math.min(data.length - start, size - written);
          result.set(data.subarray(start, start + n), written);
          written += n;
        });
      }
      if (patchedFstBytes && overlays.length > 0) {
        const fstEnd = GALE01_FST_OFFSET + patchedFstBytes.length;
        const ovStart = Math.max(offset, GALE01_FST_OFFSET);
        const ovEnd = Math.min(offset + size, fstEnd);
        if (ovEnd > ovStart) {
          const copy = new Uint8Array(result.length);
          copy.set(result);
          copy.set(
            patchedFstBytes.subarray(ovStart - GALE01_FST_OFFSET, ovEnd - GALE01_FST_OFFSET),
            ovStart - offset
          );
          return copy;
        }
      }
      return result;
    };
    return missing ? Promise.all(pieces).then(combine) : combine(pieces);
  }

  return {
    read,
    registerDiscOverlay,
    clearDiscOverlays,
    get residentBytes() {
      return bytes;
    },
    get cachedBlockCount() {
      return blocks.size;
    },
    get virtualDiscSize() {
      return virtualDiscSize;
    },
    get overlays() {
      return overlays.map((ov) => ({
        slotIndex: ov.slotIndex,
        fstFileNames: ov.fstFileNames,
        virtualOffset: ov.virtualOffset,
        byteLength: ov.byteLength,
      }));
    },
    get patchedFstEntries() {
      return patchedFstEntries.slice();
    },
    get overlayStats() {
      return { ...overlayStats };
    },
  };
}
