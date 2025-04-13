export function parseUserAgent (uaString: string): { browser: string, os: string, deviceType: string } {
	// Browser detection with version
	let browser = 'Ukendt Browser'
	let os = 'Ukendt Styresystem'
	let deviceType = 'desktop'

	// Browser detection
	if (uaString.includes('Firefox/')) {
		const match = uaString.match(/Firefox\/([0-9.]+)/)
		browser = (match != null) ? `Firefox ${match[1]}` : 'Firefox'
	} else if (uaString.includes('Edg/')) {
		const match = uaString.match(/Edg\/([0-9.]+)/)
		browser = (match != null) ? `Edge ${match[1]}` : 'Edge'
	} else if (uaString.includes('Chrome/') && !uaString.includes('Chromium/')) {
		const match = uaString.match(/Chrome\/([0-9.]+)/)
		browser = (match != null) ? `Chrome ${match[1]}` : 'Chrome'
	} else if (uaString.includes('Safari/') && !uaString.includes('Chrome/') && !uaString.includes('Chromium/')) {
		const match = uaString.match(/Version\/([0-9.]+)/)
		browser = (match != null) ? `Safari ${match[1]}` : 'Safari'
	} else if (uaString.includes('OPR/') || uaString.includes('Opera/')) {
		const match = uaString.match(/OPR\/([0-9.]+)/) ?? uaString.match(/Opera\/([0-9.]+)/)
		browser = (match != null) ? `Opera ${match[1]}` : 'Opera'
	} else if (uaString.includes('MSIE') || uaString.includes('Trident/')) {
		browser = 'Internet Explorer'
	}

	// OS detection
	if (uaString.includes('Windows NT')) {
		const match = uaString.match(/Windows NT ([0-9.]+)/)
		if (match != null) {
			const version = match[1]
			switch (version) {
				case '10.0': os = 'Windows 10/11'; break
				case '6.3': os = 'Windows 8.1'; break
				case '6.2': os = 'Windows 8'; break
				case '6.1': os = 'Windows 7'; break
				case '6.0': os = 'Windows Vista'; break
				case '5.2': os = 'Windows XP x64'; break
				case '5.1': os = 'Windows XP'; break
				default: os = `Windows (NT ${version})`
			}
		} else {
			os = 'Windows'
		}
	} else if (uaString.includes('Mac OS X')) {
		const match = uaString.match(/Mac OS X ([0-9_.]+)/)
		if (match != null) {
			// Convert 10_15_7 format to 10.15.7
			const version = match[1].replace(/_/g, '.')
			os = `macOS ${version}`
		} else {
			os = 'macOS'
		}
	} else if (uaString.includes('Linux')) {
		if (uaString.includes('Android')) {
			const match = uaString.match(/Android ([0-9.]+)/)
			os = (match != null) ? `Android ${match[1]}` : 'Android'
		} else {
			os = 'Linux'
		}
	} else if (uaString.includes('iPhone OS') || uaString.includes('iPad')) {
		const match = uaString.match(/OS ([0-9_]+)/)
		if (match != null) {
			// Convert 15_4 format to 15.4
			const version = match[1].replace(/_/g, '.')
			os = `iOS ${version}`
		} else {
			os = 'iOS'
		}
	}

	// Device type detection
	if (
		uaString.includes('iPhone') ||
	(uaString.includes('Android') && !uaString.includes('Mobile Safari/')) ||
	/Mobile|Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(uaString)
	) {
		deviceType = 'mobile'
	} else if (uaString.includes('iPad') || uaString.includes('Tablet') || (uaString.includes('Android') && uaString.includes('Mobile Safari/'))) {
		deviceType = 'tablet'
	}

	return { browser, os, deviceType }
}
