import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Admin',
	alternates: {
		canonical: 'https://www.kantine.nyskivehus.dk/admin'
	}
}

export default function AdminLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return <section>{children}</section>
}
