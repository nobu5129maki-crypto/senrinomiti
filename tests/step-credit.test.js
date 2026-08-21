import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATCH_UP_MAX_DAYS,
  catchUpDateWindow,
  computeCatchUpDelta,
  journeyStartDateKey,
  restoreTodayWatermark
} from '../js/step-credit.js';
import { listDateKeysInclusive, shiftDateKey } from '../js/date-utils.js';

describe('computeCatchUpDelta', () => {
  it('same-day background walk is credited as a delta', () => {
    const result = computeCatchUpDelta({
      sourceTotal: 1500,
      alreadyCredited: 1000,
      allowBackgroundCatchUp: true
    });
    assert.equal(result.delta, 500);
    assert.equal(result.nextCredited, 1500);
    assert.equal(result.reason, 'credit');
  });

  it('credits a full new day when tracking was already on', () => {
    const result = computeCatchUpDelta({
      sourceTotal: 3200,
      alreadyCredited: 0,
      allowBackgroundCatchUp: true
    });
    assert.equal(result.delta, 3200);
    assert.equal(result.nextCredited, 3200);
    assert.equal(result.reason, 'credit');
  });

  it('does not dump pre-tracking history on first sync', () => {
    const result = computeCatchUpDelta({
      sourceTotal: 8000,
      alreadyCredited: 0,
      allowBackgroundCatchUp: false
    });
    assert.equal(result.delta, 0);
    assert.equal(result.nextCredited, 8000);
    assert.equal(result.reason, 'first-sync-baseline');
  });

  it('still credits small first-sync values', () => {
    const result = computeCatchUpDelta({
      sourceTotal: 12,
      alreadyCredited: 0,
      allowBackgroundCatchUp: false
    });
    assert.equal(result.delta, 12);
    assert.equal(result.reason, 'credit');
  });

  it('suppresses credit while aligning a new journey baseline', () => {
    const result = computeCatchUpDelta({
      sourceTotal: 4000,
      alreadyCredited: 0,
      suppressCredit: true,
      allowBackgroundCatchUp: true
    });
    assert.equal(result.delta, 0);
    assert.equal(result.nextCredited, 4000);
    assert.equal(result.reason, 'suppressed');
  });

  it('uses journey-start floor so only post-start steps count that day', () => {
    const result = computeCatchUpDelta({
      sourceTotal: 9000,
      alreadyCredited: 0,
      floorCredited: 4000,
      allowBackgroundCatchUp: true
    });
    assert.equal(result.delta, 5000);
    assert.equal(result.nextCredited, 9000);
  });

  it('does not double-count a pending day already credited', () => {
    const result = computeCatchUpDelta({
      sourceTotal: 5000,
      alreadyCredited: 5000,
      allowBackgroundCatchUp: true
    });
    assert.equal(result.delta, 0);
    assert.equal(result.reason, 'none');
  });
});

describe('restoreTodayWatermark', () => {
  it('keeps same-day native total as the watermark', () => {
    const result = restoreTodayWatermark({
      today: '2026-08-21',
      markerDate: '2026-08-21',
      markerTotal: 1800,
      lastNativeTotal: 2000
    });
    assert.equal(result.applyToToday, true);
    assert.equal(result.watermark, 2000);
  });

  it('does not treat yesterday total as today watermark', () => {
    const result = restoreTodayWatermark({
      today: '2026-08-21',
      markerDate: '2026-08-20',
      markerTotal: 8000,
      lastNativeTotal: 8000
    });
    assert.equal(result.applyToToday, false);
    assert.equal(result.watermark, 0);
    assert.equal(result.sessionSteps, 0);
  });
});

describe('catchUpDateWindow', () => {
  it('covers yesterday back to the journey start', () => {
    const result = catchUpDateWindow({
      journeyStartedAt: '2026-08-18T15:00:00+09:00',
      today: '2026-08-21'
    });
    assert.equal(result.from, '2026-08-18');
    assert.equal(result.to, '2026-08-20');
    assert.deepEqual(result.days, ['2026-08-18', '2026-08-19', '2026-08-20']);
  });

  it('does not include today', () => {
    const result = catchUpDateWindow({
      journeyStartedAt: '2026-08-21T08:00:00+09:00',
      today: '2026-08-21'
    });
    assert.equal(result.days.length, 0);
  });

  it('caps very old journeys', () => {
    const result = catchUpDateWindow({
      journeyStartedAt: '2025-01-01T00:00:00+09:00',
      today: '2026-08-21',
      maxDays: CATCH_UP_MAX_DAYS
    });
    assert.equal(result.days.length, CATCH_UP_MAX_DAYS);
    assert.equal(result.to, '2026-08-20');
    assert.equal(result.from, shiftDateKey('2026-08-21', -CATCH_UP_MAX_DAYS));
  });
});

describe('date helpers', () => {
  it('lists inclusive date keys', () => {
    assert.deepEqual(
      listDateKeysInclusive('2026-08-19', '2026-08-21'),
      ['2026-08-19', '2026-08-20', '2026-08-21']
    );
  });

  it('parses journey start date in local calendar', () => {
    assert.equal(journeyStartDateKey('2026-08-18T23:30:00+09:00'), '2026-08-18');
  });
});

describe('background catch-up scenarios', () => {
  it('credits OS steps after the app stayed closed overnight', () => {
    const restored = restoreTodayWatermark({
      today: '2026-08-21',
      markerDate: '2026-08-20',
      markerTotal: 6400,
      lastNativeTotal: 6400
    });
    assert.equal(restored.applyToToday, false);

    const result = computeCatchUpDelta({
      sourceTotal: 2150,
      alreadyCredited: restored.watermark,
      allowBackgroundCatchUp: true
    });
    assert.equal(result.delta, 2150);
    assert.equal(result.reason, 'credit');
  });

  it('credits only the uncounted remainder after a same-day reopen', () => {
    const restored = restoreTodayWatermark({
      today: '2026-08-21',
      markerDate: '2026-08-21',
      markerTotal: 1800,
      lastNativeTotal: 1800
    });
    const result = computeCatchUpDelta({
      sourceTotal: 2500,
      alreadyCredited: restored.watermark,
      allowBackgroundCatchUp: true
    });
    assert.equal(result.delta, 700);
  });
});
