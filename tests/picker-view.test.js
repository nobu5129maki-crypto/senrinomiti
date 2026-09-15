import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toPickerLatLng } from '../js/map.js';

describe('toPickerLatLng', () => {
  it('accepts numeric coordinates', () => {
    assert.deepEqual(toPickerLatLng({ lat: 35.0116, lng: 135.7681 }), {
      lat: 35.0116,
      lng: 135.7681
    });
  });

  it('parses string coordinates from geocoders', () => {
    assert.deepEqual(toPickerLatLng({ lat: '48.8738', lng: '2.2950' }), {
      lat: 48.8738,
      lng: 2.295
    });
  });

  it('rejects missing or out-of-range values so a pin is not placed off-map', () => {
    assert.equal(toPickerLatLng(null), null);
    assert.equal(toPickerLatLng({ name: '金閣寺' }), null);
    assert.equal(toPickerLatLng({ lat: 91, lng: 0 }), null);
    assert.equal(toPickerLatLng({ lat: 0, lng: 200 }), null);
    assert.equal(toPickerLatLng({ lat: 'n/a', lng: '2' }), null);
  });
});
