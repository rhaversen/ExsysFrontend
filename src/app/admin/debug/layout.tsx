import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Debug - Betalingssimulator',
	alternates: {
		canonical: 'https://www.kantine.nyskivehus.dk/admin/debug'
	}
}

export default function DebugLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return <>{children}</>
}
