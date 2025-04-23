'use client'

import { usePathname, useRouter } from 'next/navigation'
import { type ReactElement, useEffect, useState } from 'react'

const PageLink = ({
	text,
	link,
	className,
	selected,
	onSelect
}: {
	text: string
	link: string
	className?: string
	selected: boolean
	onSelect: () => void
}): ReactElement => {
	const router = useRouter()
	const pathname = usePathname()
	const [isClicked, setIsClicked] = useState(false)

	function handleClick (): void {
		setIsClicked(true)
		onSelect() // Update the selected link in the Header component
		router.push(link)
	}

	useEffect(() => {
		// Reset the clicked state whenever the pathname changes
		setIsClicked(false)
	}, [pathname])

	return (
		<div className={`flex ${className} p-2`}>
			<button
				type="button"
				onClick={handleClick}
				className={`flex items-center justify-center w-full h-full border-b-2 transition-all ${selected ? 'border-b-blue-500' : 'border-b-gray-500'} ${selected ? '' : 'hover:border-b-blue-400'} ${isClicked ? 'animate-pulse' : ''}`}
				disabled={selected}
			>
				{text}
			</button>
		</div>
	)
}

export default PageLink
