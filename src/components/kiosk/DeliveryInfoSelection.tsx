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
		<main className="flex flex-col min-h-screen bg-zinc-100">
			<div className="flex flex-col items-center justify-center py-20 pb-5">
				<header className="mb-8 flex flex-col gap-5 items-center">
					<h1 className="text-gray-800 text-6xl font-bold">{title}</h1>
					<p className="text-gray-600 text-2xl">{subtitle}</p>
				</header>

				{priorityItems.length > 0 && (
					<div className="flex flex-wrap justify-center mb-8">
						{priorityItems.map((item) => (
							<button
								key={item._id}
								onClick={() => { onSelect(item) }}
								className="p-10 m-5 bg-white rounded shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
							>
								<h2 className="text-3xl font-bold mb-2 text-gray-800">
									{item.name}
								</h2>
								{(item.description != null) && (
									<p className="text-gray-600 text-xl">
										{item.description}
									</p>
								)}
							</button>
						))}
					</div>
				)}
			</div>

			{otherItems.length > 0 && (
				<div className="flex-1 overflow-y-auto w-full pb-12">
					<div className="w-full max-w-4xl mx-auto mb-8">
						<div className="grid grid-cols-2 gap-4">
							{otherItems.map((item, index) => (
								<div key={item._id}>
									<button
										onClick={() => { onSelect(item) }}
										className="w-full text-left py-3 px-4 rounded shadow-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
									>
										<div className="grid grid-cols-2 gap-4">
											<span className="font-semibold text-lg text-gray-900">{item.name}</span>
											{(item.description != null) && (
												<span className="text-gray-700">
													{item.description}
												</span>
											)}
										</div>
									</button>
									{index < otherItems.length - 1 && (
										<div className="border-b border-gray-200" />
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{items.length === 0 && (
				<div>
					<p className="text-center text-gray-800 text-2xl">{'Der er ikke fundet nogle muligheder'}</p>
					<p className="text-center text-gray-800 text-2xl">{'Kontakt venligst personalet'}</p>
				</div>
			)}
		</main>
	)
}
