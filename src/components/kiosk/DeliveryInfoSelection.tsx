import { type ReactElement } from 'react'

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
	onSelect
}: {
	title: string
	subtitle: string
	items: T[]
	priorityItems: T[]
	onSelect: (item: T) => void
}): ReactElement {
	const otherItems = items.filter(item => !priorityItems.some(pi => pi._id === item._id))

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
							onClick={() => { onSelect(item) }}
							className="w-[400px] p-6 bg-white rounded-lg shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
						>
							<h2 className="text-2xl font-bold mb-2 text-gray-800">
								{item.name}
							</h2>
							{(item.description != null) && (
								<p className="text-xl text-gray-600">
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
									onClick={() => { onSelect(item) }}
									className="w-[300px] p-4 bg-white rounded-lg shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
								>
									<div className="flex flex-col">
										<span className="font-semibold text-lg text-gray-900">
											{item.name}
										</span>
										{(item.description != null) && (
											<span className="text-base text-gray-700">
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
