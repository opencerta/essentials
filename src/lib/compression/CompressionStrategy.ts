// @opencerta/essentials
// Copyright (C) 2020 OpenCerta
//
// This library is free software; you can redistribute it and/or
// modify it under the terms of the GNU Lesser General Public
// License as published by the Free Software Foundation; either
// version 3.0 of the License, or (at your option) any later version.
//
// This library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public
// License along with this library; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA

import { brotliCompressSync, brotliDecompressSync, constants, deflateSync, gunzipSync, gzipSync, inflateSync } from 'zlib';

// cSpell:ignore brotli, bwtc, bzip, compressjs, lzp3
import { BWTC, Bzip2, Lzp3 } from 'compressjs';
import { decode, encode } from 'messagepack';

export enum CompressionAlgorithm {
  identity,
  deflate,
  gzip,
  bzip2,
  brotli,
  bwtc,
  lzp3,
  messagepack,
}

export class CompressionStrategyRegistry {
  private registry: Map<number, CompressionStrategy>;

  constructor() {
    this.registry = new Map<number, CompressionStrategy>();
    this.registry.set(CompressionAlgorithm.identity, new IdentityCompressionStrategy());
    this.registry.set(CompressionAlgorithm.brotli, new BrotliCompressionStrategy());
    this.registry.set(CompressionAlgorithm.bwtc, new BwtcCompressionStrategy());
    this.registry.set(CompressionAlgorithm.bzip2, new Bzip2CompressionStrategy());
    this.registry.set(CompressionAlgorithm.deflate, new DeflateCompressionStrategy());
    this.registry.set(CompressionAlgorithm.gzip, new GzipCompressionStrategy());
    this.registry.set(CompressionAlgorithm.lzp3, new Lzp3CompressionStrategy());
    this.registry.set(CompressionAlgorithm.messagepack, new MessagePackCompressionStrategy());
  }

  public getStrategy(algorithm: number): CompressionStrategy {
    if (this.registry.has(algorithm)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.registry.get(algorithm)!;
    }
    throw new Error(`unknown algorithm id: ${algorithm}`);
  }
}

/**
 * The CompressionStrategy interface declares operations common to all
 * supported compression algorithms.
 */
export type CompressionStrategy = {
  compress(payload: Uint8Array): Uint8Array;
  decompress(payload: Uint8Array): Uint8Array;
};

class IdentityCompressionStrategy implements CompressionStrategy {
  public compress(payload: Uint8Array): Uint8Array {
    return payload;
  }

  public decompress(payload: Uint8Array): Uint8Array {
    return payload;
  }
}

class BrotliCompressionStrategy implements CompressionStrategy {
  public compress(payload: Uint8Array): Uint8Array {
    return Uint8Array.from(
      brotliCompressSync(payload, {
        params: {
          [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
          [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
        },
      })
    );
  }

  public decompress(payload: Uint8Array): Uint8Array {
    return Uint8Array.from(brotliDecompressSync(payload));
  }
}

class BwtcCompressionStrategy implements CompressionStrategy {
  public compress(payload: Uint8Array): Uint8Array {
    return BWTC.compressFile(payload);
  }

  public decompress(payload: Uint8Array): Uint8Array {
    return BWTC.decompressFile(payload);
  }
}

class Bzip2CompressionStrategy implements CompressionStrategy {
  public compress(payload: Uint8Array): Uint8Array {
    return Bzip2.compressFile(payload);
  }

  public decompress(payload: Uint8Array): Uint8Array {
    return Bzip2.decompressFile(payload);
  }
}

class DeflateCompressionStrategy implements CompressionStrategy {
  public compress(payload: Uint8Array): Uint8Array {
    return Uint8Array.from(
      deflateSync(payload, {
        level: constants.Z_BEST_COMPRESSION,
      })
    );
  }

  public decompress(payload: Uint8Array): Uint8Array {
    return Uint8Array.from(inflateSync(payload));
  }
}

class GzipCompressionStrategy implements CompressionStrategy {
  public compress(payload: Uint8Array): Uint8Array {
    return Uint8Array.from(
      gzipSync(payload, {
        level: constants.Z_BEST_COMPRESSION,
      })
    );
  }

  public decompress(payload: Uint8Array): Uint8Array {
    return Uint8Array.from(gunzipSync(payload));
  }
}

class Lzp3CompressionStrategy implements CompressionStrategy {
  public compress(payload: Uint8Array): Uint8Array {
    return Lzp3.compressFile(payload);
  }

  public decompress(payload: Uint8Array): Uint8Array {
    return Lzp3.decompressFile(payload);
  }
}

class MessagePackCompressionStrategy implements CompressionStrategy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private encoder: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private decoder: any;

  constructor() {
    const match = process.version.match(/^v(\d+)\.(\d+)/);
    if (match && match[1] === '10') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.encoder = new (require('util').TextEncoder)('utf-8');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.decoder = new (require('util').TextDecoder)('utf-8');
    } else {
      this.encoder = new TextEncoder();
      this.decoder = new TextDecoder();
    }
  }

  public compress(payload: Uint8Array): Uint8Array {
    try {
      return encode(JSON.parse(this.decoder.decode(payload))); // serialize JSON document
    } catch (err) {
      return encode(payload); // serialize as a binary payload
    }
  }

  public decompress(payload: Uint8Array): Uint8Array {
    const data = payload[0];
    if ((data >= 0x80 && data <= 0x8f) || data == 0xde || data == 0xdf) {
      return this.encoder.encode(JSON.stringify(decode(payload))); // JSON document
    }
    return new Uint8Array(decode(payload)); // binary payload
  }
}
