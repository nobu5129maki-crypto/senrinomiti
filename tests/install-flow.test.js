import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  bindIntentControl,
  openInChromeCandidates,
} from '../js/install-flow.js';

describe('openInChromeCandidates', () => {
  it('builds a Chrome intent that keeps the install page path', () => {
    const [href] = openInChromeCandidates('https://senrinomiti.vercel.app/install.html');
    assert.match(href, /^intent:\/\/senrinomiti\.vercel\.app\/install\.html#Intent;/);
    assert.match(href, /package=com\.android\.chrome/);
    assert.match(href, /scheme=https/);
    assert.match(href, /;end$/);
  });
});

describe('bindIntentControl', () => {
  it('sets href and does not preventDefault on Android anchor clicks', () => {
    const hrefs = openInChromeCandidates('https://senrinomiti.vercel.app/install.html');
    let storedHref = '';
    let listener = null;
    const el = {
      tagName: 'A',
      setAttribute(name, value) {
        if (name === 'href') storedHref = value;
      },
      addEventListener(type, fn) {
        if (type === 'click') listener = fn;
      }
    };

    bindIntentControl(el, hrefs, {
      ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36'
    });
    assert.equal(storedHref, hrefs[0]);
    assert.equal(typeof listener, 'function');

    let prevented = false;
    listener({ preventDefault() { prevented = true; } });
    assert.equal(prevented, false);
  });

  it('prevents default on desktop so the page can show a fallback message', () => {
    const hrefs = openInChromeCandidates('https://senrinomiti.vercel.app/install.html');
    let listener = null;
    const el = {
      tagName: 'A',
      setAttribute() {},
      addEventListener(type, fn) {
        if (type === 'click') listener = fn;
      }
    };
    bindIntentControl(el, hrefs, { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0' });
    let prevented = false;
    listener({ preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
  });
});
