import { type Metadata } from 'next'

import Header from '@/components/admin/ui/header/Header'
import AdminAuthProvider from '@/contexts/AdminAuthProvider'
import ConfigProvider from '@/contexts/ConfigProvider'

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
			<ConfigProvider>
				<Header />
				{children}
			</ConfigProvider>
		</AdminAuthProvider>
	)
}
