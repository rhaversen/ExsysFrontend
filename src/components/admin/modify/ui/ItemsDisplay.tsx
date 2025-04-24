import { type ReactElement } from 'react'
import { FaDivide, FaPlus } from 'react-icons/fa'

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
		<div className="flex flex-row flex-wrap max-w-md justify-center">
			{items.sort((a, b) => a.name.localeCompare(b.name)).map((item) => (
				<div
					key={item._id}
					className="flex items-center justify-between w-auto bg-gray-200 text-gray-800 m-1 rounded-md px-2 py-1"
				>
					<p className="text-center text-sm">{item.name}</p>
					{editable && (onDeleteItem != null) && (
						<button
							type="button"
							title="Fjern"
							className="cursor-pointer p-1"
							onClick={() => { onDeleteItem(item) }}
						>
							<p className="sr-only">{'Delete'}</p>
							<FaDivide className="text-red-500 text-xs" />
						</button>
					)}
				</div>
			))}
			{editable && (
				<div className="m-1 text-center font-semibold text-sm border-2 border-blue-500 rounded-full">
					<button
						type="button"
						title="Tilføj"
						className="cursor-pointer flex items-center justify-center w-6 h-6"
						onClick={() => {
							onShowItems()
						}}
					>
						<FaPlus className="text-blue-500 text-xs" />
					</button>
				</div>
			)}
		</div>
	)
}

export default ItemsDisplay
