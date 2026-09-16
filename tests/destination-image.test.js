import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSpotImageUrl } from '../js/spot-image.js';

describe('destination images', () => {
  it('resolves 金閣寺 to its own photo', () => {
    const url = resolveSpotImageUrl('kinkakuji', '金閣寺');
    assert.ok(url && url.startsWith('http'), '金閣寺の画像URLが必要');
  });

  it('resolves 凱旋門 without using the Eiffel Tower photo', () => {
    const url = resolveSpotImageUrl('arc-de-triomphe', '凱旋門');
    assert.ok(url && /Arc_de_Triomphe/i.test(url), `凱旋門の専用画像が必要: ${url}`);
    assert.equal(/Eiffel/i.test(url), false);
  });
});
