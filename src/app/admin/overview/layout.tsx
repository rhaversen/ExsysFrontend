import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Overview',
	alternates: {
		canonical: 'https://www.kantine.nyskivehus.dk/admin/overview'
	}
}

export default function Overview ({
	children
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return <section>{children}</section>
}
