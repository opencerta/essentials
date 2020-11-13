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

/* spell-checker: disable */
import test from 'ava';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let encoder: any;
const match = process.version.match(/^v(\d+)\.(\d+)/);
if (match && match[1] === '10') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  encoder = new (require('util').TextEncoder)('utf-8');
} else {
  encoder = new TextEncoder();
}

import { CompressionAlgorithm, CompressionStrategy, CompressionStrategyRegistry } from './CompressionStrategy';

const text: Uint8Array = encoder.encode(
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras non turpis mi. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Suspendisse potenti. Nam ac varius metus. Nunc fringilla lorem ac nulla rutrum, sit amet mollis sem iaculis. Morbi ullamcorper dignissim elementum. Pellentesque in semper justo, non consectetur nibh. Proin tincidunt efficitur erat venenatis bibendum. Aliquam rhoncus venenatis orci, eget convallis sapien volutpat vel. Nulla facilisi. Phasellus lorem metus, vehicula sed enim id, cursus auctor quam. Sed bibendum, odio et molestie pharetra, tellus leo laoreet velit, eget rhoncus sem mi at purus. Nulla feugiat risus a scelerisque semper. Donec non ex ut magna vulputate consectetur ac quis metus.'
);
const registry: CompressionStrategyRegistry = new CompressionStrategyRegistry();

/**
 * Test all registered compression algorithms
 */
Object.keys(CompressionAlgorithm)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .filter((key: any) => isNaN(Number(CompressionAlgorithm[key])))
  .forEach((algorithm) => {
    test(`retrieve '${CompressionAlgorithm[Number(algorithm)]}' compression strategy`, async (t) => {
      const strategy: CompressionStrategy = registry.getStrategy(Number(algorithm));
      const compressed = strategy.compress(text);
      const decompressed = strategy.decompress(compressed);
      t.true(compressed instanceof Uint8Array);
      t.deepEqual(decompressed, text);
    });
  });

/**
 * Test for unknown algorithm IDs
 */
test(`retrieve 'unknown' compression strategy`, async (t) => {
  t.throws(() => registry.getStrategy(100));
});

/**
 * Test a JSON document with messagepack
 */
test('compress / decompress a JSON document with message pack', async (t) => {
  const payload: Uint8Array = encoder.encode(JSON.stringify({ compact: true, schema: 0 })); // JSON object payload
  const strategy: CompressionStrategy = registry.getStrategy(CompressionAlgorithm.messagepack);
  const compressed = strategy.compress(payload);
  const decompressed = strategy.decompress(compressed);
  t.deepEqual(decompressed, payload);
});
