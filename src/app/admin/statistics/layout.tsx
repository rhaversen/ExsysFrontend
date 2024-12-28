import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | Ny Skivehus Kantine',
		default: 'Statistik'
	},
	alternates: {
		canonical: 'https://www.kantine.nyskivehus.dk/admin/statistics'
	}
}

export default function StatisticsLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return <>{children}</>
}
