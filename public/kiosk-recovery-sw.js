const OFFLINE_PAGE = '/kiosk-offline.html'

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open('kiosk-recovery').then((cache) => cache.add(OFFLINE_PAGE))
	)
	self.skipWaiting()
})

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
	if (event.request.mode !== 'navigate') return

	event.respondWith(
		fetch(event.request).catch(() =>
			caches.match(OFFLINE_PAGE)
		)
	)
})
