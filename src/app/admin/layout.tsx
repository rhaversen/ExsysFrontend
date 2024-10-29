import Header from '@/components/admin/ui/header/Header'
import AdminAuthProvider from '@/contexts/AdminAuthProvider'
import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | Ny Skivehus Kantine',
		default: 'Admin'
	},
	alternates: {
		canonical: 'https://www.kantine.nyskivehus.dk/admin'
	}
}

export default function AdminLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return (
		<AdminAuthProvider>
			<Header />
			{children}
		</AdminAuthProvider>
	)
}
