import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | Ny Skivehus Kantine',
		default: 'Bestil'
	},
	alternates: {
		canonical: 'https://www.kantine.nyskivehus.dk/orderstation'
	}
}

export default function OrderLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return <section>{children}</section>
}
