import { type ReactElement, useState, useRef, useEffect } from 'react'

interface SelectionItem {
	_id: string
	name: string
	description?: string
}

export default function DeliveryInfoSelection<T extends SelectionItem> ({
	title,
	subtitle,
	items,
	currentSelectionId,
	onSelect
}: {
	title: string
	subtitle: string
	items: T[]
	currentSelectionId: string | undefined
	onSelect: (item: T) => void
}): ReactElement {
	const [clickedId, setClickedId] = useState<string | null>(null)
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		return () => {
			if (timeoutRef.current !== null) { clearTimeout(timeoutRef.current) }
		}
	}, [])

	useEffect(() => {
		if (currentSelectionId === undefined) {
			setClickedId(null)
		}
	}, [currentSelectionId])

	const handleClick = (item: T): void => {
		setClickedId(item._id)
		timeoutRef.current = setTimeout(() => {
			onSelect(item)
		}, 150)
	}

	const getButtonClasses = (itemId: string): string => {
		const isSelected = clickedId !== null ? clickedId === itemId : currentSelectionId === itemId
		return `w-100 p-6 rounded-xl shadow-md focus:outline-none text-white bg-blue-500
			transition-all duration-200 ${isSelected ? 'scale-105' : ''}`
	}

	return (
		<main className="flex flex-col items-center justify-center mx-auto min-h-full gap-6 p-6">
			<header className="text-center">
				<h1 className="text-gray-800 text-6xl font-bold">{title}</h1>
				<p className="text-gray-600 text-2xl mt-4">{subtitle}</p>
			</header>

			{items.length > 0 ? (
				<div className="flex flex-wrap justify-center gap-4 max-w-5xl">
					{items.map((item) => (
						<button
							key={item._id}
							onClick={() => { handleClick(item) }}
							className={getButtonClasses(item._id)}
						>
							<h2 className="text-2xl font-bold text-white">{item.name}</h2>
							{item.description != null && (
								<p className="text-xl text-white">{item.description}</p>
							)}
						</button>
					))}
				</div>
			) : (
				<div className="text-center text-gray-800 text-2xl">
					<p>{'Der er ikke fundet nogle muligheder'}</p>
					<p>{'Kontakt venligst personalet'}</p>
				</div>
			)}
		</main>
	)
}
