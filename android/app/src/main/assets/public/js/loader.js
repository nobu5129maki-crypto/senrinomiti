(function () {
  window.__senriAppLoaded = false;
  window.__senriLastError = '';

  // パス補正（サブディレクトリ配置対応）
  var path = location.pathname;
  var last = path.split('/').pop() || '';
  if (!path.endsWith('/') && !/\.[a-z0-9]+$/i.test(last)) {
    location.replace(path + '/index.html' + location.search + location.hash);
    return;
  }

  if (path.endsWith('/')) {
    window.__senriBase = location.origin + path;
  } else {
    window.__senriBase = location.origin + path.substring(0, path.lastIndexOf('/') + 1);
  }

  // Service Worker（Web版のみ。ネイティブアプリでは同梱ファイルをそのまま使用）
  var isNativeShell = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  if ('serviceWorker' in navigator && !isNativeShell) {
    var swUrl = (window.__senriBase || './') + 'sw.js';
    navigator.serviceWorker.register(swUrl).catch(function () {});
  }

  window.__senriMarkLoaded = function () {
    window.__senriAppLoaded = true;
    var errEl = document.getElementById('senri-load-error');
    if (errEl) errEl.remove();
  };

  window.__senriShowLoadError = function (message) {
    if (window.__senriAppLoaded) return;
    if (message) window.__senriLastError = message;

    if (document.getElementById('senri-load-error')) return;

    var detail = window.__senriLastError
      ? '<p style="background:#fff;border:1px solid #cce8e2;border-radius:8px;padding:10px;font-size:12px;word-break:break-all;margin-bottom:16px">' +
        String(window.__senriLastError).replace(/</g, '&lt;') + '</p>'
      : '';

    var div = document.createElement('div');
    div.id = 'senri-load-error';
    div.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9999', 'background:#eef7f4',
      'padding:24px', 'overflow:auto', 'font-family:sans-serif', 'color:#1a3d38'
    ].join(';');
    div.innerHTML =
      '<h2 style="color:#065954;margin-bottom:12px">読み込みに失敗しました</h2>' +
      '<p style="line-height:1.7;margin-bottom:12px">アプリの読み込みに失敗しました。通信環境を確認して、もう一度お試しください。</p>' +
      detail +
      '<button type="button" id="senri-repair-btn" style="width:100%;padding:14px;background:#0c7a73;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:bold;margin-bottom:12px">もう一度読み込む</button>' +
      '<p style="font-size:13px;color:#5f7a75;line-height:1.6">改善しない場合は、アプリを一度終了してから開き直してください。</p>';
    document.body.appendChild(div);
    document.getElementById('senri-repair-btn').onclick = function () {
      location.reload();
    };
  };

  window.addEventListener('error', function (e) {
    if (window.__senriAppLoaded) return;
    var file = e.filename || '';
    if (file.indexOf('.js') === -1) return;
    window.__senriLastError = (e.message || 'Script error') + ' (' + file + ')';
    window.__senriShowLoadError();
  }, true);

  window.addEventListener('unhandledrejection', function (e) {
    if (window.__senriAppLoaded) return;
    var reason = e.reason;
    window.__senriLastError = reason && reason.message ? reason.message : String(reason);
    window.__senriShowLoadError();
  });

  // 自動リロードは行わない（読み込み中断の原因になる）
  setTimeout(function () {
    if (!window.__senriAppLoaded) {
      window.__senriShowLoadError('タイムアウト: アプリの読み込みが完了しませんでした');
    }
  }, 20000);
})();
