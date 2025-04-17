export function parseUserAgent (uaString: string): { browser: string, os: string, deviceType: string } {
	// Browser detection with version
	let browser = 'Ukendt Browser'
	let os = 'Ukendt Styresystem'
	let deviceType = 'desktop'

	// Device detection first (since it affects OS detection)
	if (uaString.includes('iPhone')) {
		deviceType = 'mobile'
		os = 'iPhone'
	} else if (uaString.includes('iPad')) {
		deviceType = 'tablet'
		os = 'iPad'
	} else if (uaString.includes('Android') && uaString.includes('Mobile')) {
		deviceType = 'mobile'
	} else if (uaString.includes('Android')) {
		deviceType = 'tablet'
	} else if (/Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(uaString)) {
		deviceType = 'mobile'
	}

	// iOS version detection
	if (uaString.includes('iPhone OS') || uaString.includes('CPU iPhone OS') ||
		(uaString.includes('iPad') && uaString.includes('CPU OS'))) {
		const match = uaString.match(/(?:iPhone OS|CPU iPhone OS|CPU OS) ([0-9_]+)/)
		if (match != null) {
			// Convert 15_4 format to 15.4
			const version = match[1].replace(/_/g, '.')
			// Only update OS when it's an iOS device (keep the device type from above)
			os = deviceType === 'mobile' && os === 'iPhone'
				? `iPhone iOS ${version}`
				: deviceType === 'tablet' && os === 'iPad'
					? `iPad iOS ${version}`
					: `iOS ${version}`
		}
	}

	// Browser detection
	if (uaString.includes('Firefox/')) {
		const match = uaString.match(/Firefox\/([0-9.]+)/)
		browser = (match != null) ? `Firefox ${match[1]}` : 'Firefox'
	} else if (uaString.includes('Edg/')) {
		const match = uaString.match(/Edg\/([0-9.]+)/)
		browser = (match != null) ? `Edge ${match[1]}` : 'Edge'
	} else if (uaString.includes('CriOS/')) {
		// Chrome on iOS
		const match = uaString.match(/CriOS\/([0-9.]+)/)
		browser = (match != null) ? `Chrome ${match[1]}` : 'Chrome'
	} else if (uaString.includes('Chrome/') && !uaString.includes('Chromium/')) {
		const match = uaString.match(/Chrome\/([0-9.]+)/)
		browser = (match != null) ? `Chrome ${match[1]}` : 'Chrome'
	} else if (uaString.includes('Safari/')) {
		// For Safari, we need to be careful with version detection
		// On iOS, Version/ gives Safari version
		const match = uaString.match(/Version\/([0-9.]+)/)
		browser = (match != null) ? `Safari ${match[1]}` : 'Safari'
	} else if (uaString.includes('OPR/') || uaString.includes('Opera/')) {
		const match = uaString.match(/OPR\/([0-9.]+)/) ?? uaString.match(/Opera\/([0-9.]+)/)
		browser = (match != null) ? `Opera ${match[1]}` : 'Opera'
	} else if (uaString.includes('MSIE') || uaString.includes('Trident/')) {
		browser = 'Internet Explorer'
	}

	// OS detection (for non-iOS systems)
	if (os === 'Ukendt Styresystem') {
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
		} else if (uaString.includes('Mac OS X') && !uaString.includes('iPhone') && !uaString.includes('iPad')) {
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
		}
	}

	return { browser, os, deviceType }
}
