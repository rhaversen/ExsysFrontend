import { type Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | Ny Skivehus Kantine',
		default: 'Log Ind Kiosk'
	},
	alternates: {
		canonical: 'https://life-stats.net/admin/login-kiosk'
	}
}

export default function LoginLayout ({
	children
}: Readonly<{
	children: React.ReactNode
}>): React.JSX.Element {
	return <section>
		{children}
	</section>
}
