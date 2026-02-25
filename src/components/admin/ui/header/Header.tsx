'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactElement, useEffect, useRef, useState } from 'react'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { FiTerminal } from 'react-icons/fi'

import { useUser } from '@/contexts/UserProvider'
import { type AdminType } from '@/types/backendDataTypes'

import CloseableModal from '../../../ui/CloseableModal'
import LogoutButton from '../LogoutButton'

import PageLink from './PageLink'

type Environment = 'production' | 'staging' | 'development'

const ENVIRONMENTS: Array<{ env: Environment, label: string, url: string, color: string }> = [
	{ env: 'production', label: 'Produktion', url: 'https://kantine.nyskivehus.dk', color: 'bg-green-500' },
	{ env: 'staging', label: 'Test', url: 'https://staging.kantine.nyskivehus.dk', color: 'bg-yellow-500' },
	{ env: 'development', label: 'Lokal', url: 'http://localhost:3000', color: 'bg-blue-500' }
]

function detectEnvironment (): Environment {
	if (typeof window === 'undefined') { return 'development' }
	const host = window.location.hostname
	if (host === 'kantine.nyskivehus.dk') { return 'production' }
	if (host === 'staging.kantine.nyskivehus.dk') { return 'staging' }
	return 'development'
}

const Header = (): ReactElement | null => {
	const { currentUser } = useUser()
	const [isClient, setIsClient] = useState(false)
	const [dropdownOpen, setDropdownOpen] = useState(false)
	const [isScrolled, setIsScrolled] = useState(false)
	const [isLoggingOut, setIsLoggingOut] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const headerRef = useRef<HTMLElement>(null)
	const [headerHeight, setHeaderHeight] = useState(64)
	const pathname = usePathname()
	const [selectedLink, setSelectedLink] = useState<string>(pathname ?? '')

	const routeTitles = {
		'/admin/modify': 'Modificer',
		'/admin/statistics': 'Statistik',
		'/admin/analytics': 'Analyse',
		'/admin/feedback': 'Feedback'
	}

	useEffect(() => {
		setIsClient(true)

		// Update selectedLink when the pathname changes
		setSelectedLink(pathname ?? '')

		const handleScroll = (): void => {
			setIsScrolled(window.scrollY > 0)
		}

		const handleClickOutside = (event: MouseEvent): void => {
			if ((dropdownRef.current !== null) && !dropdownRef.current.contains(event.target as Node)) {
				setDropdownOpen(false)
			}
		}

		window.addEventListener('scroll', handleScroll)
		document.addEventListener('mousedown', handleClickOutside)

		const observer = new ResizeObserver(([entry]) => {
			if (entry != null) {
				setHeaderHeight(entry.contentRect.height)
			}
		})
		if (headerRef.current != null) {
			observer.observe(headerRef.current)
		}

		return () => {
			window.removeEventListener('scroll', handleScroll)
			document.removeEventListener('mousedown', handleClickOutside)
			observer.disconnect()
		}
	}, [pathname])

	// TODO: Dont return null if not client, return a loading spinner or something instead of user name
	if (!isClient) {
		return null
	}

	const name = (currentUser as AdminType)?.name ?? 'Mangler Navn'
	const currentEnv = detectEnvironment()
	const currentEnvConfig = ENVIRONMENTS.find(e => e.env === currentEnv) ?? ENVIRONMENTS[0]

	return (
		<>
			<header
				ref={headerRef}
				className={`w-full items-center bg-gray-900 fixed top-0 left-0 right-0 z-50 transition-shadow ${isScrolled ? 'shadow-lg duration-500' : 'duration-0'}`}
			>
				<div className="flex items-center justify-between text-sm md:text-lg align-middle max-w-6xl mx-auto h-16 px-4">
					{/* Left side: Home link + env badge */}
					<div className="flex items-center shrink-0 gap-2">
						<Link href="/admin" className="text-white font-semibold md:font-bold">
							{'Hjem'}
						</Link>
						{currentEnv !== 'production' && (
							<span className={`${currentEnvConfig.color} text-white text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded`}>
								{currentEnvConfig.label}
							</span>
						)}
					</div>
					{/* Center: Page links */}
					<div className="flex items-center justify-center h-full flex-grow mx-1 md:mx-2">
						{Object.entries(routeTitles).map(([route, title]) => (
							<PageLink
								key={route}
								text={title}
								link={route}
								selected={selectedLink === route}
								onSelect={() => { setSelectedLink(route) }}
							/>
						))}
					</div>
					{/* Right side: User dropdown */}
					<div className="flex items-center justify-end flex-shrink-0">
						<div className="relative" ref={dropdownRef}>
							<button
								onClick={() => { setDropdownOpen(!dropdownOpen) }}
								className="text-white font-semibold md:font-bold focus:outline-none flex items-center"
								type="button"
							>
								<span>{name}</span>
								<span className="ml-1">
									{dropdownOpen
										? (
											<FaChevronUp className="w-3 h-3 md:w-4 md:h-4" />
										)
										: (
											<FaChevronDown className="w-3 h-3 md:w-4 md:h-4" />
										)}
								</span>
							</button>
							<div
								className={`absolute right-0 mt-2 w-52 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-20 transform transition-all duration-200 ${dropdownOpen
									? 'opacity-100 scale-100'
									: 'opacity-0 scale-95 pointer-events-none'}`}
							>
								<div className="px-3 py-2 border-b border-gray-700">
									<p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{'Miljø'}</p>
									{ENVIRONMENTS.map(env => (
										<a
											key={env.env}
											href={env.env === currentEnv ? '#' : `${env.url}/admin`}
											onClick={(e) => {
												if (env.env === currentEnv) { e.preventDefault() }
												setDropdownOpen(false)
											}}
											className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
												env.env === currentEnv
													? 'bg-gray-700 text-white'
													: 'text-gray-300 hover:bg-gray-700 hover:text-white'
											}`}
										>
											<span className={`w-2 h-2 rounded-full ${env.color}`} />
											{env.label}
											{env.env === currentEnv && (
												<span className="ml-auto text-xs text-gray-400">{'aktuel'}</span>
											)}
										</a>
									))}
								</div>
								<div className="px-3 py-2 border-b border-gray-700">
									<Link
										href="/admin/debug"
										onClick={() => { setDropdownOpen(false) }}
										className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
									>
										<FiTerminal className="w-4 h-4" />
										{'Betalingssimulator'}
									</Link>
								</div>
								<div className="px-3 py-2">
									<LogoutButton
										isLoggingOut={isLoggingOut}
										setIsLoggingOut={setIsLoggingOut}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
				{currentEnv === 'staging' && (
					<div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
						<div className="max-w-6xl mx-auto flex items-start gap-2 text-xs text-yellow-800">
							<span className="font-semibold shrink-0 mt-px">{'⚠ Testmiljø:'}</span>
							<span>
								{'Dette er staging-miljøet med en separat database. Ændringer her påvirker ikke produktionsmiljøet. Miljøet afspejler produktion og understøtter fuld drift inkl. SumUp-betalinger og kiosker.'}
							</span>
						</div>
					</div>
				)}
			</header>

			<div style={{ marginTop: `${headerHeight}px` }} />

			{/* Conditionally render the modal */}
			{isLoggingOut && (
				<CloseableModal canClose={false} onClose={() => {}}>
					<div className="p-6 text-center">
						<p className="text-lg font-semibold text-gray-700">{'Logger ud...'}</p>
					</div>
				</CloseableModal>
			)}
		</>
	)
}

export default Header
