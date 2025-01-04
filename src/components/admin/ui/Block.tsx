'use client'

import { useRouter } from 'next/navigation'
import React, { type ReactElement, useState } from 'react'

const Block = ({
	text,
	link,
	className
}: {
	text: string
	link: string
	className?: string
}): ReactElement => {
	const router = useRouter()
	const [isClicked, setIsClicked] = useState(false)

	function handleClick (): void {
		setIsClicked(true)
		router.push(link)
	}

	return (
		<div className={`flex ${className} w-full h-full`}>
			<button
				className={`p-2 flex-grow flex items-center justify-center text-black rounded-md transition-all border-2 border-gray-500 hover:border-blue-500 hover:scale-110 hover:shadow-lg w-full h-full ${isClicked ? 'cursor-clicked' : 'cursor-pointer'}`}
				type="button"
				disabled={isClicked}
				onClick={handleClick}
			>
				{text}
			</button>
		</div>
	)
}

export default Block
