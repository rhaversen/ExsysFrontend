import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | Ny Skivehus Kantine',
		default: 'Modificer'
	},
	alternates: {
		canonical: 'https://www.kantine.nyskivehus.dk/admin/modify'
	}
}

export default function ModifyLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return <>{children}</>
}
