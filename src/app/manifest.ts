import { type MetadataRoute } from 'next'

export default function manifest (): MetadataRoute.Manifest {
	return {
		name: 'Ny Skivehus Kantine',
		short_name: 'Kantine',
		start_url: '/',
		display: 'standalone',
		background_color: '#fff',
		theme_color: '#fff',
		icons: [
			{
				src: '/favicon.ico',
				sizes: 'any',
				type: 'image/x-icon'
			}
		]
	}
}
