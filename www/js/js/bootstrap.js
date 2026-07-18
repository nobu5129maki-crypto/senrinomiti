(function () {
  var lastTabAt = 0;
  var lastTabView = '';
  var PENDING_KEY = 'senri-pending';

  function applyTabView(name) {
    if (!name) return;
    document.querySelectorAll('.nav-tab').forEach(function (tab) {
      var on = tab.getAttribute('data-view') === name;
      tab.classList.toggle('active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.main > .view').forEach(function (el) {
      var on = el.id === 'view-' + name;
      el.classList.toggle('active', on);
      if (on) {
        el.removeAttribute('hidden');
        el.removeAttribute('inert');
      } else {
        el.setAttribute('hidden', '');
        el.setAttribute('inert', '');
      }
    });
    window.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent('senri:tab', { detail: { view: name } }));
    if (typeof window.__senriOnTab === 'function') {
      window.__senriOnTab(name);
    }
  }

  function onTabPointer(e) {
    var tab = e.target.closest('.nav-tab');
    if (!tab) return;
    e.preventDefault();
    var view = tab.getAttribute('data-view');
    var now = Date.now();
    if (view === lastTabView && now - lastTabAt < 500) return;
    lastTabAt = now;
    lastTabView = view;
    applyTabView(view);
  }

  var nav = document.querySelector('.nav-tabs');
  if (nav) {
    nav.addEventListener('touchend', onTabPointer, { capture: true, passive: false });
    nav.addEventListener('click', onTabPointer, true);
  }

  window.__senriApplyTabView = applyTabView;

  function isAppReady() {
    return typeof window.__senriApplyCustomRoute === 'function';
  }

  function invokeApp(action, pendingValue) {
    if (isAppReady()) {
      action();
      return;
    }

    try {
      sessionStorage.setItem(PENDING_KEY, pendingValue);
    } catch (e) { /* ignore */ }

    var attempts = 0;
    var timer = setInterval(function () {
      attempts += 1;
      if (isAppReady()) {
        clearInterval(timer);
        try { sessionStorage.removeItem(PENDING_KEY); } catch (e) { /* ignore */ }
        action();
      } else if (attempts >= 150) {
        clearInterval(timer);
        if (typeof window.__senriShowLoadError === 'function') {
          window.__senriShowLoadError();
        }
      }
    }, 100);
  }

  window.__senriTriggerCustomRoute = function () {
    invokeApp(function () {
      window.__senriApplyCustomRoute();
    }, 'custom-route');
  };

  window.__senriTriggerPreset = function (presetId) {
    if (!presetId) return;
    invokeApp(function () {
      window.__senriSelectPreset(presetId);
    }, 'preset:' + presetId);
  };

  window.__senriTriggerMode = function (mode) {
    invokeApp(function () {
      window.__senriSetMode(mode);
    }, 'mode:' + mode);
  };

  window.__senriFlushPending = function () {
    var pending;
    try {
      pending = sessionStorage.getItem(PENDING_KEY);
      if (pending) sessionStorage.removeItem(PENDING_KEY);
    } catch (e) {
      pending = null;
    }
    if (!pending || !isAppReady()) return;

    if (pending === 'custom-route') {
      window.__senriApplyCustomRoute();
    } else if (pending.indexOf('preset:') === 0) {
      window.__senriSelectPreset(pending.slice(7));
    } else if (pending.indexOf('mode:') === 0) {
      window.__senriSetMode(pending.slice(5));
    }
  };
})();
