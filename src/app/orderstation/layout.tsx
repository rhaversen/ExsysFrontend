import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | Ny Skivehus Kantine',
		default: 'Vælg Rum'
	},
	alternates: {
		canonical: 'https://www.kantine.nyskivehus.dk/orderstation'
	}
}

export default function SelectRoomLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return <section>{children}</section>
}
