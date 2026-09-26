import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { placeRelatesToQuery } from '../js/geocode.js';

describe('placeRelatesToQuery', () => {
  it('drops tourist offices that do not contain the query', () => {
    assert.equal(
      placeRelatesToQuery({ name: '両国観光案内所', displayName: '両国観光案内所（横網JR両国駅）' }, '東京駅'),
      false
    );
    assert.equal(
      placeRelatesToQuery({ name: '調布観光案内所', displayName: '調布観光案内所（布田四丁目調布駅前広場）' }, '東京駅'),
      false
    );
  });

  it('keeps places whose name includes the query', () => {
    assert.equal(
      placeRelatesToQuery({ name: '東京駅', displayName: '東京駅' }, '東京駅'),
      true
    );
    assert.equal(
      placeRelatesToQuery({ name: '鹿苑寺', displayName: '鹿苑寺（金閣寺）' }, '金閣寺'),
      true
    );
  });
});
