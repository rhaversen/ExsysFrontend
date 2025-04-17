import { type Metadata } from 'next'

import SoundProvider from '@/contexts/SoundProvider'

export const metadata: Metadata = {
	title: {
		template: '%s | Ny Skivehus Kantine',
		default: 'Køkken'
	},
	alternates: {
		canonical: 'https://www.kantine.nyskivehus.dk/admin/kitchen'
	}
}

export default function kitchenLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return <SoundProvider>{children}</SoundProvider>
}
