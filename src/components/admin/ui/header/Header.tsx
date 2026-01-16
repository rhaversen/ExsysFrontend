'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactElement, useEffect, useRef, useState } from 'react'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'

import { useUser } from '@/contexts/UserProvider'
import { type AdminType } from '@/types/backendDataTypes'

import CloseableModal from '../../../ui/CloseableModal'
import LogoutButton from '../LogoutButton'

import PageLink from './PageLink'

const Header = (): ReactElement | null => {
	const { currentUser } = useUser()
	const [isClient, setIsClient] = useState(false)
	const [dropdownOpen, setDropdownOpen] = useState(false)
	const [isScrolled, setIsScrolled] = useState(false)
	const [isLoggingOut, setIsLoggingOut] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)
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

		return () => {
			window.removeEventListener('scroll', handleScroll)
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [pathname])

	// TODO: Dont return null if not client, return a loading spinner or something instead of user name
	if (!isClient) {
		return null
	}

	const name = (currentUser as AdminType)?.name ?? 'Mangler Navn'

	return (
		<>
			<header
				className={`w-full h-16 items-center bg-gray-900 fixed top-0 left-0 right-0 z-50 transition-shadow ${isScrolled ? 'shadow-lg duration-500' : 'duration-0'}`}
			>
				<div className="flex items-center justify-between text-sm md:text-lg align-middle max-w-6xl mx-auto h-full px-4">
					{/* Left side: Home button */}
					<div className="flex items-center flex-shrink-0">
						<Link href="/admin" className="text-white font-semibold md:font-bold">
							{'Hjem'}
						</Link>
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
								className={`absolute right-0 w-20 md:w-24 mt-2 z-20 transform transition-all duration-200 ${dropdownOpen
									? 'opacity-100 scale-100'
									: 'opacity-0 scale-95 pointer-events-none'}`}
							>
								<LogoutButton
									isLoggingOut={isLoggingOut}
									setIsLoggingOut={setIsLoggingOut}
								/>
							</div>
						</div>
					</div>
				</div>
			</header>
			{/* Add padding to the top of the page content */}
			<div className="mt-16"></div>

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
