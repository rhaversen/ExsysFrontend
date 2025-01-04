import DailyReloader from '@/components/DailyReloader'
import ErrorProvider from '@/contexts/ErrorContext/ErrorProvider'
import UserProvider from '@/contexts/UserProvider'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { type ReactElement } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: {
		template: '%s | Ny Skivehus Kantine',
		default: 'Vælg Opgave'
	},
	description: 'Bestil mad fra Ny Skivehus Kantine',
	alternates: {
		canonical: 'https://www.kantine.nyskivehus.dk'
	},
	icons: {
		icon: '/favicon.ico'
	}
}

export default function RootLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): ReactElement {
	return (
		<html lang="da">
			<body className={inter.className}>
				<ErrorProvider>
					<UserProvider>
						<DailyReloader />
						{children}
					</UserProvider>
				</ErrorProvider>
			</body>
		</html>
	)
}
