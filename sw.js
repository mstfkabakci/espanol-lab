/* Español Lab service worker: works offline, picks up updates when online. */
const CACHE = "espanol-lab-202611041218";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./favicon-32.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
const put = (req, res) => caches.open(CACHE).then(c => c.put(req, res));
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (req.mode === "navigate") {            // the page itself: network first, cache as fallback
    e.respondWith(fetch(req, { cache: "no-cache" }).then(res => { put("./index.html", res.clone()); return res; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === "opaque") put(req, res.clone());
      return res;
    }).catch(() => new Response("", { status: 504 }))));
  }
});
