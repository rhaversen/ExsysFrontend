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
	priorityItems,
	currentSelectionId,
	onSelect
}: {
	title: string
	subtitle: string
	items: T[]
	priorityItems: T[]
	currentSelectionId: string | undefined
	onSelect: (item: T) => void
}): ReactElement {
	const [clickedId, setClickedId] = useState<string | null>(null)
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)
	const otherItems = items.filter(item => !priorityItems.some(pi => pi._id === item._id))

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

	const getButtonClasses = (itemId: string, baseClasses: string): string => {
		const isSelected = clickedId !== null ? clickedId === itemId : currentSelectionId === itemId
		return `${baseClasses} transition-all duration-200 ${isSelected ? 'bg-blue-600 scale-105' : 'bg-blue-500'}`
	}

	return (
		<main className="flex flex-col min-h-full justify-center items-center gap-6 pt-15">
			<header className="flex flex-col gap-4 items-center">
				<h1 className="text-gray-800 text-6xl font-bold">{title}</h1>
				<p className="text-gray-600 text-2xl">{subtitle}</p>
			</header>

			{priorityItems.length > 0 && (
				<div className="flex flex-wrap justify-center gap-4 px-4">
					{priorityItems.map((item) => (
						<button
							key={item._id}
							onClick={() => { handleClick(item) }}
							className={getButtonClasses(item._id, 'w-100 p-6 rounded-lg shadow-md focus:outline-none')}
						>
							<h2 className="text-2xl font-bold text-white">
								{item.name}
							</h2>
							{(item.description != null) && (
								<p className="text-xl text-white">
									{item.description}
								</p>
							)}
						</button>
					))}
				</div>
			)}

			{otherItems.length > 0 && (
				<div className="w-full px-4 mb-8">
					<div className="max-w-5xl mx-auto">
						<div className="flex flex-wrap justify-center gap-3">
							{otherItems.map((item) => (
								<button
									key={item._id}
									onClick={() => { handleClick(item) }}
									className={getButtonClasses(item._id, 'w-60 p-3 rounded-lg shadow-md focus:outline-none')}
								>
									<div className="flex flex-col">
										<span className="font-semibold text-lg text-white">
											{item.name}
										</span>
										{(item.description != null) && (
											<span className="text-base text-white">
												{item.description}
											</span>
										)}
									</div>
								</button>
							))}
						</div>
					</div>
				</div>
			)}

			{items.length === 0 && priorityItems.length === 0 && (
				<div>
					<p className="text-center text-gray-800 text-2xl">{'Der er ikke fundet nogle muligheder'}</p>
					<p className="text-center text-gray-800 text-2xl">{'Kontakt venligst personalet'}</p>
				</div>
			)}
		</main>
	)
}
