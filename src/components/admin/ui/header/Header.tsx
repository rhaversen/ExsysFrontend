'use client'

import React, { useState, useEffect, useRef, type ReactElement } from 'react'
import { useUser } from '@/contexts/UserProvider'
import { type AdminType } from '@/types/backendDataTypes'
import Link from 'next/link'
import LogoutButton from '../LogoutButton'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { usePathname } from 'next/navigation'
import PageLink from './PageLink'

const Header = (): ReactElement | null => {
	const { currentUser } = useUser()
	const [isClient, setIsClient] = useState(false)
	const [dropdownOpen, setDropdownOpen] = useState(false)
	const [isScrolled, setIsScrolled] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const pathname = usePathname()
	const [selectedLink, setSelectedLink] = useState<string>(pathname)

	const routeTitles = {
		'/admin/kitchen': 'Køkken',
		'/admin/modify': 'Modificer',
		'/admin/statistics': 'Statistik'
	}

	useEffect(() => {
		setIsClient(true)

		// Update selectedLink when the pathname changes
		setSelectedLink(pathname)

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

	if (!isClient) {
		return null
	}

	const name = (currentUser as AdminType)?.name ?? 'Mangler Navn'

	return (
		<>
			<header className={`w-full h-10 bg-gray-900 fixed top-0 left-0 right-0 z-50 transition-shadow ${isScrolled ? 'shadow-lg duration-500' : 'duration-0'}`}
			>
				<div className="flex items-center justify-between px-5">
					{/* Left side: Home button */}
					<div className="flex items-center">
						<Link href="/admin" className="text-white font-bold">
							{'Hjem'}
						</Link>
					</div>
					{/* Center: Page links */}
					<div className="flex items-center justify-center h-full">
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
					<div className="flex items-center justify-end">
						<div className="relative" ref={dropdownRef}>
							<button
								onClick={() => { setDropdownOpen(!dropdownOpen) }}
								className="text-white font-bold focus:outline-none flex items-center"
								type="button"
							>
								{name}
								<span className="ml-1">
									{dropdownOpen
										? (
											<FaChevronUp className="w-4 h-4" />
										)
										: (
											<FaChevronDown className="w-4 h-4" />
										)}
								</span>
							</button>
							<div className={`absolute right-0 w-24 mt-2 z-20 transform transition-all duration-200 ${dropdownOpen
								? 'opacity-100 scale-100'
								: 'opacity-0 scale-95 pointer-events-none'}`}
							>
								<LogoutButton />
							</div>
						</div>
					</div>
				</div>
			</header>
			{/* Add padding to the top of the page content */}
			<div className="mt-10"></div>
		</>
	)
}

export default Header