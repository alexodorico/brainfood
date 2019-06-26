self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("brainfood-cache").then(cache => {
      console.log(cache);
      return cache.addAll(
        [
          "/index.html",
          "/dist/bundle.css",
          "/dist/main.js"
        ]
      );
    })
  );
});