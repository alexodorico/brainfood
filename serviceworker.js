const cacheName = "v1";

self.addEventListener("install", event => {
  console.log("Service worker installed");

  event.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log('Caching files');
      return cache.addAll(
        [
          "/",
          "/index.html",
          "/dist/bundle.css",
          "/dist/main.js",
          "/dist/fonts/Nunito-Black.ttf",
          "/dist/fonts/Nunito-Bold.ttf",
          "/dist/fonts/Nunito-Regular.ttf",
          "/dist/fonts/PT_Sans-Web-Bold.ttf",
          "/dist/fonts/PT_Sans-Web-BoldItalic.ttf"
        ]
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});