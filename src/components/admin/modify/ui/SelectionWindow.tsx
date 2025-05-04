import { type ReactElement, useCallback } from 'react'

import CloseableModal from '@/components/ui/CloseableModal'

interface Item {
	_id: string
	name: string
	disabled?: boolean // Add optional disabled property
}

const SelectionWindow = <T extends Item> ({
	title,
	items,
	selectedItems,
	onAddItem,
	onDeleteItem,
	onClose
}: {
	title: string
	items: T[]
	selectedItems: T[]
	onAddItem: (v: T) => void
	onDeleteItem: (v: T) => void
	onClose: () => void
}): ReactElement => {
	const handleToggle = useCallback((item: T): void => {
		// Prevent toggling if the item is disabled
		if (item.disabled === true) {
			return
		}
		if (selectedItems.map((i) => i._id).includes(item._id)) {
			onDeleteItem(item)
		} else {
			onAddItem(item)
		}
	}, [selectedItems, onDeleteItem, onAddItem])

	return (
		<CloseableModal
			onComplete={onClose}
			onClose={onClose}
			canComplete={true}
		>
			<h2 className="text-lg font-bold text-gray-800 text-center">
				{title}
			</h2>
			<div className="bg-white p-2 rounded flex flex-col lg:flex-wrap max-h-96 content-start overflow-y-auto">
				{items.sort((a, b) => a.name.localeCompare(b.name)).map((item) => (
					<div
						key={item._id}
						// Add styling for disabled items
						className={`flex items-center p-1 mb-2 text-gray-800 ${
							item.disabled === true ? 'opacity-50 cursor-not-allowed' : ''
						}`}
					>
						<input
							title={item.disabled === true ? 'Utilgængelig' : 'Tilføj'}
							type="checkbox"
							// Disable checkbox and adjust cursor for disabled items
							className={`w-5 h-5 ${
								item.disabled === true ? 'cursor-not-allowed' : 'cursor-pointer'
							}`}
							checked={selectedItems.map((i) => i._id).includes(item._id)}
							onChange={() => {
								handleToggle(item)
							}}
							// Disable the checkbox input if item is disabled
							disabled={item.disabled}
						/>
						<span className="ml-2">{item.name}</span>
					</div>
				))}
			</div>
			<div className="flex justify-center gap-4 pt-2">
				<button
					type="button"
					className="bg-blue-500 hover:bg-blue-600 text-white rounded-md py-2 px-4"
					onClick={onClose}
				>
					{'Færdig'}
				</button>
			</div>
		</CloseableModal>
	)
}

export default SelectionWindow
