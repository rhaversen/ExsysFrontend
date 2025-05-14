import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | Ny Skivehus Kantine',
		default: 'Feedback'
	},
	description: 'Administrer og gennemse brugerfeedback for Ny Skivehus Kantine.',
	alternates: {
		canonical: 'https://www.kantine.nyskivehus.dk/admin/feedback'
	}
}

export default function FeedbackLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return <>{children}</>
}
