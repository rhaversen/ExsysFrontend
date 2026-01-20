const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="da">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Kiosk - Ingen forbindelse</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: black;
			color: #6b7280;
			height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.container {
			background: rgba(17, 24, 39, 0.5);
			padding: 2.5rem;
			border-radius: 0.5rem;
			text-align: center;
		}
		h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
		p { font-size: 1rem; }
	</style>
</head>
<body>
	<div class="container">
		<h1>Ingen forbindelse</h1>
		<p>Kiosken forsøger at genoprette forbindelsen...</p>
	</div>
	<script>
		async function checkAndReload() {
			try {
				const response = await fetch('/kiosk', { method: 'HEAD', cache: 'no-store' });
				if (response.ok) {
					window.location.href = '/kiosk';
				}
			} catch {}
		}
		
		checkAndReload();
		setInterval(checkAndReload, 10000);
	</script>
</body>
</html>`

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
	if (event.request.mode !== 'navigate') return

	event.respondWith(
		fetch(event.request).catch(() =>
			new Response(OFFLINE_HTML, {
				headers: { 'Content-Type': 'text/html; charset=utf-8' }
			})
		)
	)
})
