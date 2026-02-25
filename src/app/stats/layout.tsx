import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Statistik',
	description: 'Offentlig statistik for Ny Skivehus Kantine',
	alternates: {
		canonical: 'https://www.kantine.nyskivehus.dk/stats'
	}
}

export default function StatsLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return <>{children}</>
}
