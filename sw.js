// Kelime Avcısı Pro Elite - Service Worker
const CACHE_NAME = 'kelime-avcisi-v1';

// Cache'lenecek kaynaklar
const ASSETS = [
    './index.html',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Outfit:wght@300;600;900&display=swap',
];

// Kurulum: dosyaları cache'e al
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // Kritik dosyaları cache'le (hata olursa devam et)
            return cache.addAll(ASSETS).catch(() => {});
        })
    );
    self.skipWaiting();
});

// Aktivasyon: eski cache'leri temizle
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// Fetch: önce network, hata olursa cache'den sun
self.addEventListener('fetch', (e) => {
    // Firebase isteklerini service worker'dan geçirme
    if (e.request.url.includes('firebase') || 
        e.request.url.includes('firestore') ||
        e.request.url.includes('googleapis.com/identitytoolkit')) {
        return;
    }

    e.respondWith(
        fetch(e.request)
            .then(response => {
                // Başarılı response'u cache'e de yaz
                if (response && response.status === 200 && response.type !== 'opaque') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                }
                return response;
            })
            .catch(() => {
                // Network yoksa cache'den sun (offline mod)
                return caches.match(e.request).then(cached => {
                    if (cached) return cached;
                    // Hiçbir şey yoksa index.html döndür
                    return caches.match('./index.html');
                });
            })
    );
});
