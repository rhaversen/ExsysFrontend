import Image from 'next/image'
import { AdminImages } from '@/lib/images'
import React, { type ReactElement } from 'react'

interface GenericItem {
	_id: string
	name: string
}

function ItemsDisplay<T extends GenericItem> ({
	items,
	editable = true,
	onDeleteItem,
	onShowItems
}: {
	items: T[]
	editable?: boolean
	onDeleteItem?: (item: T) => void
	onShowItems: () => void
}): ReactElement {
	return (
		<div className="flex flex-row flex-wrap max-w-md">
			{items.sort((a, b) => a.name.localeCompare(b.name)).map((item) => (
				<div
					key={item._id}
					className="flex items-center justify-between w-auto bg-gray-200 text-gray-800 m-1 rounded-full px-2 py-1"
				>
					<p className="text-center text-sm font-semibold">{item.name}</p>
					{editable && (onDeleteItem != null) && (
						<button
							type="button"
							title="Fjern"
							className="cursor-pointer"
							onClick={() => { onDeleteItem(item) }}
						>
							<p className="sr-only">{'Delete'}</p>
							<Image
								src={AdminImages.delete.src}
								alt={AdminImages.delete.alt}
								width={15}
								height={15}
							/>
						</button>
					)}
				</div>
			))}
			{editable && (
				<div className="m-1 text-center font-semibold border-2 border-blue-500 rounded-full">
					<button
						type="button"
						title="Tilføj"
						className="cursor-pointer"
						onClick={() => {
							onShowItems()
						}}
					>
						<div className="text-blue-500 px-3 items-center">{' + '}</div>
					</button>
				</div>
			)}
		</div>
	)
}

export default ItemsDisplay
