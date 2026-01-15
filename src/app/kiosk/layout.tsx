import { type Metadata } from 'next'

import KioskBroadcastedEventHandlers from '@/components/kiosk/KioskBroadcastedEventHandlers'
import { AnalyticsProvider } from '@/contexts/AnalyticsProvider'
import ConfigProvider from '@/contexts/ConfigProvider'
import KioskAuthProvider from '@/contexts/KioskAuthProvider'

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
					<KioskBroadcastedEventHandlers />
					{children}
				</AnalyticsProvider>
			</ConfigProvider>
		</KioskAuthProvider>
	)
}
