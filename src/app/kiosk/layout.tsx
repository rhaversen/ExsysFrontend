import { type Metadata, type Viewport } from 'next'

import DailyReloader from '@/components/kiosk/DailyReloader'
import KioskBroadcastedEventHandlers from '@/components/kiosk/KioskBroadcastedEventHandlers'
import KioskEnvBanner from '@/components/kiosk/KioskEnvBanner'
import { AnalyticsProvider } from '@/contexts/AnalyticsProvider'
import ConfigProvider from '@/contexts/ConfigProvider'
import KioskAuthProvider from '@/contexts/KioskAuthProvider'

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false
}

export const metadata: Metadata = {
	title: {
		template: '%s | Ny Skivehus Kantine',
		default: 'Bestil'
	},
	alternates: {
		canonical: 'https://www.kantine.nyskivehus.dk/kiosk'
	}
}

export default function SelectRoomLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return (
		<KioskAuthProvider>
			<ConfigProvider>
				<AnalyticsProvider>
					<div className="kiosk-touch">
						<DailyReloader />
						<KioskBroadcastedEventHandlers />
						<KioskEnvBanner />
						{children}
					</div>
				</AnalyticsProvider>
			</ConfigProvider>
		</KioskAuthProvider>
	)
}
