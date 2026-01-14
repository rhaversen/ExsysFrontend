import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { type ReactElement } from 'react'

import DailyReloader from '@/components/kiosk/DailyReloader'
import ErrorProvider from '@/contexts/ErrorContext/ErrorProvider'
import UserProvider from '@/contexts/UserProvider'

import './globals.css'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin']
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin']
})

export const metadata: Metadata = {
	title: {
		template: '%s | Ny Skivehus Kantine',
		default: 'Ny Skivehus Kantine'
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
	children: React.ReactNode;
}>): ReactElement {
	return (
		<html lang='da'>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
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
