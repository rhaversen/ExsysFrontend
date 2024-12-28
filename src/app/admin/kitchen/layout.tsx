import { type Metadata } from 'next'

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
	return <>{children}</>
}
