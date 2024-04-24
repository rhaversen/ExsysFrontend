import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: {
		template: '%s | Kantine',
		default: 'Kantine', // a default is required when creating a template
	},
	description: 'Bestil mad fra Ny Skivehus Kantine',
	icons: {
		icon: '/favicon.ico',
	}
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="da">
		</html>
	)
}
