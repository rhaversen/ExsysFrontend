export function parseUserAgent (uaString: string): { browser: string, os: string } {
	// Simple user agent parsing (for demo purposes)
	const browserMatch = uaString.match(/(Firefox|Chrome|Safari|Edge|Opera|Trident)/)
	const osMatch = uaString.match(/(Windows NT|Mac OS X|Linux|Android|iPhone|iPad)/)

	return {
		browser: (browserMatch !== null) ? browserMatch[0] : 'Ukendt Browser',
		os: (osMatch !== null) ? osMatch[0] : 'Ukendt Styresystem'
	}
}
