import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Bestil',
	alternates: {
		canonical: 'https://www.kantine.nyskivehus.dk/user'
	}
}

export default function UserLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return <section>{children}</section>
}
