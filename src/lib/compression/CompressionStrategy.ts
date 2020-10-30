import {
  brotliCompressSync,
  brotliDecompressSync,
  constants,
  deflateSync,
  gunzipSync,
  gzipSync,
  inflateSync,
} from 'zlib';

import { BWTC, Bzip2, Lzp3 } from 'compressjs';

enum CompressionAlgorithm {
  identity,
  deflate,
  gzip,
  bzip2,
  brotli,
  bwtc,
  lzp3,
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
  compress(payload: ArrayBuffer): ArrayBuffer;
  decompress(payload: ArrayBuffer): ArrayBuffer;
};

class IdentityCompressionStrategy implements CompressionStrategy {
  public compress(payload: ArrayBuffer): ArrayBuffer {
    return payload;
  }

  public decompress(payload: ArrayBuffer): ArrayBuffer {
    return payload;
  }
}

class BrotliCompressionStrategy implements CompressionStrategy {
  public compress(payload: ArrayBuffer): ArrayBuffer {
    return brotliCompressSync(payload, {
      params: {
        [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
        [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
      },
    });
  }

  public decompress(payload: ArrayBuffer): ArrayBuffer {
    return brotliDecompressSync(payload);
  }
}

class BwtcCompressionStrategy implements CompressionStrategy {
  public compress(payload: ArrayBuffer): ArrayBuffer {
    return BWTC.compressFile(Buffer.from(payload)).buffer;
  }

  public decompress(payload: ArrayBuffer): ArrayBuffer {
    return BWTC.decompressFile(Buffer.from(payload)).buffer;
  }
}

class Bzip2CompressionStrategy implements CompressionStrategy {
  public compress(payload: ArrayBuffer): ArrayBuffer {
    return Bzip2.compressFile(Buffer.from(payload)).buffer;
  }

  public decompress(payload: ArrayBuffer): ArrayBuffer {
    return Bzip2.decompressFile(Buffer.from(payload)).buffer;
  }
}

class DeflateCompressionStrategy implements CompressionStrategy {
  public compress(payload: ArrayBuffer): ArrayBuffer {
    return deflateSync(payload, {
      level: constants.Z_BEST_COMPRESSION,
    });
  }

  public decompress(payload: ArrayBuffer): ArrayBuffer {
    return inflateSync(payload);
  }
}

class GzipCompressionStrategy implements CompressionStrategy {
  public compress(payload: ArrayBuffer): ArrayBuffer {
    return gzipSync(payload, {
      level: constants.Z_BEST_COMPRESSION,
    });
  }

  public decompress(payload: ArrayBuffer): ArrayBuffer {
    return gunzipSync(payload);
  }
}

class Lzp3CompressionStrategy implements CompressionStrategy {
  public compress(payload: ArrayBuffer): ArrayBuffer {
    return Lzp3.compressFile(Buffer.from(payload)).buffer;
  }

  public decompress(payload: ArrayBuffer): ArrayBuffer {
    return Lzp3.decompressFile(Buffer.from(payload)).buffer;
  }
}
