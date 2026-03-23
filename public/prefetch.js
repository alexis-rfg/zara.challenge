/**
 * Prefetch bootstrap — runs before the JS bundle to shorten the LCP waterfall.
 *
 * Reads configuration from `window.__PREFETCH_CONFIG__` (set inline in
 * index.html so Vite can inject environment variables) and:
 *   1. Starts the initial products API call.
 *   2. As soon as the response arrives, injects `<link rel="preload">`
 *      tags for the first above-the-fold product images.
 *
 * The in-flight promise is stored on `window.__PREFETCH__` so that
 * `src/api/client.ts` can consume it instead of issuing a duplicate request.
 */
(function () {
  var cfg = window.__PREFETCH_CONFIG__;
  if (!cfg || !cfg.apiBaseUrl) return;

  var promise = fetch(cfg.apiBaseUrl + '/products?limit=20', {
    headers: { 'x-api-key': cfg.apiKey || '' },
  })
    .then(function (r) {
      return r.ok ? r.json() : Promise.reject(r);
    })
    .catch(function () {
      return null;
    });

  window.__PREFETCH__ = { products: promise };

  // Preload the first above-the-fold product images as soon as the API
  // responds, before React mounts. This eliminates the JS→React→render→image
  // discovery chain that dominates LCP.
  promise.then(function (items) {
    if (!items || !items.length) return;
    var count = Math.min(items.length, 5);
    for (var i = 0; i < count; i++) {
      var url = items[i] && items[i].imageUrl;
      if (!url) continue;
      var link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      if (i === 0) link.fetchPriority = 'high';
      document.head.appendChild(link);
    }
  });
})();
