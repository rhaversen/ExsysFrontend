import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | Ny Skivehus Kantine',
		default: 'Ris og Ros'
	},
	alternates: {
		canonical: 'https://www.kantine.nyskivehus.dk/risros'
	}
}

export default function FeedbackLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return (
		<>{children}</>
	)
}
