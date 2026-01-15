import { parseUserAgent } from './ParsingUtils'

describe('parseUserAgent', () => {
	describe('browser detection', () => {
		it('detects Chrome on Windows', () => {
			const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Chrome 120.0.0.0')
		})

		it('detects Firefox', () => {
			const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Firefox 121.0')
		})

		it('detects Edge', () => {
			const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Edge 120.0.0.0')
		})

		it('detects Safari on macOS', () => {
			const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Safari 17.2')
		})

		it('detects Safari on iOS', () => {
			const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Safari 17.2')
		})

		it('detects Chrome on iOS (CriOS)', () => {
			const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Chrome 120.0.6099.119')
		})

		it('detects Opera (note: Safari/ check comes first so Opera is only detected without Safari/)', () => {
			const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OPR/106.0.0.0'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Opera 106.0.0.0')
		})

		it('detects Opera via Opera/ identifier', () => {
			const ua = 'Opera/9.80 (Windows NT 6.1; WOW64) Presto/2.12.388 Version/12.18'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Opera 9.80')
		})

		it('detects Internet Explorer', () => {
			const ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Internet Explorer')
		})

		it('returns unknown for unrecognized browser', () => {
			const ua = 'SomeUnknownBrowser/1.0'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Ukendt Browser')
		})

		it('detects Firefox without version', () => {
			const ua = 'Mozilla/5.0 Firefox/'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Firefox')
		})

		it('detects Safari without version', () => {
			const ua = 'Mozilla/5.0 Safari/605.1.15'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Safari')
		})
	})

	describe('OS detection', () => {
		it('detects Windows 10/11', () => {
			const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('Windows 10/11')
		})

		it('detects Windows 8.1', () => {
			const ua = 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('Windows 8.1')
		})

		it('detects Windows 8', () => {
			const ua = 'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('Windows 8')
		})

		it('detects Windows 7', () => {
			const ua = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('Windows 7')
		})

		it('detects Windows Vista', () => {
			const ua = 'Mozilla/5.0 (Windows NT 6.0; Win64; x64) AppleWebKit/537.36'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('Windows Vista')
		})

		it('detects Windows XP', () => {
			const ua = 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('Windows XP')
		})

		it('detects Windows XP x64', () => {
			const ua = 'Mozilla/5.0 (Windows NT 5.2) AppleWebKit/537.36'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('Windows XP x64')
		})

		it('detects unknown Windows version', () => {
			const ua = 'Mozilla/5.0 (Windows NT 11.0) AppleWebKit/537.36'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('Windows (NT 11.0)')
		})

		it('detects Windows without version', () => {
			const ua = 'Mozilla/5.0 (Windows NT) AppleWebKit/537.36'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('Windows')
		})

		it('detects macOS with version', () => {
			const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('macOS 10.15.7')
		})

		it('detects macOS without version', () => {
			const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('macOS')
		})

		it('detects iPhone iOS with version', () => {
			const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('iPhone iOS 17.2')
		})

		it('detects iPad iOS with version', () => {
			const ua = 'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('iPad iOS 17.2')
		})

		it('detects Android with version', () => {
			const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('Android 14')
		})

		it('detects Android without version', () => {
			const ua = 'Mozilla/5.0 (Linux; Android; Device) AppleWebKit/537.36'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('Android')
		})

		it('detects Linux', () => {
			const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('Linux')
		})

		it('returns unknown for unrecognized OS', () => {
			const ua = 'Mozilla/5.0 (SomeUnknownOS) AppleWebKit/537.36'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('Ukendt Styresystem')
		})
	})

	describe('device type detection', () => {
		it('detects desktop by default', () => {
			const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
			const result = parseUserAgent(ua)
			expect(result.deviceType).toBe('desktop')
		})

		it('detects iPhone as mobile', () => {
			const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15'
			const result = parseUserAgent(ua)
			expect(result.deviceType).toBe('mobile')
		})

		it('detects iPad as tablet', () => {
			const ua = 'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15'
			const result = parseUserAgent(ua)
			expect(result.deviceType).toBe('tablet')
		})

		it('detects Android Mobile as mobile', () => {
			const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
			const result = parseUserAgent(ua)
			expect(result.deviceType).toBe('mobile')
		})

		it('detects Android tablet (no Mobile) as tablet', () => {
			const ua = 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
			const result = parseUserAgent(ua)
			expect(result.deviceType).toBe('tablet')
		})

		it('detects BlackBerry as mobile', () => {
			const ua = 'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+'
			const result = parseUserAgent(ua)
			expect(result.deviceType).toBe('mobile')
		})

		it('detects Opera Mini on Android as tablet (no Mobile keyword)', () => {
			const ua = 'Opera/9.80 (Android; Opera Mini/36.2.2254/119.132; U; en) Presto/2.12.423 Version/12.16'
			const result = parseUserAgent(ua)
			expect(result.deviceType).toBe('tablet')
		})

		it('detects IEMobile as mobile', () => {
			const ua = 'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; Lumia 950) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Mobile Safari/537.36 Edge/15.15254 IEMobile/11.0'
			const result = parseUserAgent(ua)
			expect(result.deviceType).toBe('mobile')
		})

		it('detects webOS as mobile', () => {
			const ua = 'Mozilla/5.0 (webOS/1.4.0; U; en-US) AppleWebKit/532.2 (KHTML, like Gecko) Version/1.0 Safari/532.2 Pre/1.1'
			const result = parseUserAgent(ua)
			expect(result.deviceType).toBe('mobile')
		})
	})

	describe('complex user agents', () => {
		it('correctly parses Chrome on Android phone', () => {
			const ua = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Chrome 120.0.6099.144')
			expect(result.os).toBe('Android 14')
			expect(result.deviceType).toBe('mobile')
		})

		it('correctly parses Safari on iPhone', () => {
			const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Safari 17.2')
			expect(result.os).toBe('iPhone iOS 17.2.1')
			expect(result.deviceType).toBe('mobile')
		})

		it('correctly parses Firefox on Linux', () => {
			const ua = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Firefox 121.0')
			expect(result.os).toBe('Linux')
			expect(result.deviceType).toBe('desktop')
		})

		it('correctly parses Edge on Windows', () => {
			const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Edge 120.0.2210.91')
			expect(result.os).toBe('Windows 10/11')
			expect(result.deviceType).toBe('desktop')
		})

		it('correctly parses Safari on iPad', () => {
			const ua = 'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Safari 17.2')
			expect(result.os).toBe('iPad iOS 17.2')
			expect(result.deviceType).toBe('tablet')
		})

		it('correctly parses Chrome on macOS', () => {
			const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Chrome 120.0.0.0')
			expect(result.os).toBe('macOS 10.15.7')
			expect(result.deviceType).toBe('desktop')
		})
	})

	describe('edge cases', () => {
		it('handles empty string', () => {
			const result = parseUserAgent('')
			expect(result.browser).toBe('Ukendt Browser')
			expect(result.os).toBe('Ukendt Styresystem')
			expect(result.deviceType).toBe('desktop')
		})

		it('handles malformed user agent', () => {
			const result = parseUserAgent('not a valid user agent at all')
			expect(result.browser).toBe('Ukendt Browser')
			expect(result.os).toBe('Ukendt Styresystem')
			expect(result.deviceType).toBe('desktop')
		})

		it('handles partial user agent strings', () => {
			const result = parseUserAgent('Mozilla/5.0')
			expect(result.browser).toBe('Ukendt Browser')
			expect(result.os).toBe('Ukendt Styresystem')
		})

		it('detects iOS without version match', () => {
			const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS like Mac OS X)'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('iPhone')
			expect(result.deviceType).toBe('mobile')
		})

		it('detects iPad iOS with CPU OS format', () => {
			const ua = 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('iPad iOS 16.0')
			expect(result.deviceType).toBe('tablet')
		})

		it('detects iPod with CPU iPhone OS as mobile with iPhone iOS', () => {
			const ua = 'Mozilla/5.0 (iPod; CPU iPhone OS 15_0 like Mac OS X)'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('iPhone iOS 15.0')
		})

		it('handles Chrome without version number', () => {
			const ua = 'Mozilla/5.0 Chrome/'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Chrome')
		})

		it('handles Edge without version number', () => {
			const ua = 'Mozilla/5.0 Edg/'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Edge')
		})

		it('handles CriOS without version number', () => {
			const ua = 'Mozilla/5.0 (iPhone) CriOS/'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Chrome')
		})

		it('handles Android without version', () => {
			const ua = 'Mozilla/5.0 (Linux; Android) Mobile'
			const result = parseUserAgent(ua)
			expect(result.os).toBe('Android')
			expect(result.deviceType).toBe('mobile')
		})

		it('excludes Chromium from Chrome detection', () => {
			const ua = 'Mozilla/5.0 Chrome/100.0 Chromium/100.0'
			const result = parseUserAgent(ua)
			expect(result.browser).toBe('Ukendt Browser')
		})
	})
})
