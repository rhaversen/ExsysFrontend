import CloseableModal from '@/components/ui/CloseableModal'
import { type ReactElement, useCallback } from 'react'

interface Item {
	_id: string
	name: string
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
			<div className="bg-white p-2 rounded flex flex-col flex-wrap max-h-96">
				{items.sort((a, b) => a.name.localeCompare(b.name)).map((item) => (
					<div
						key={item._id}
						className="flex items-center p-1 mb-2 text-gray-800"
					>
						<input
							title="Tilføj"
							type="checkbox"
							className="cursor-pointer w-5 h-5"
							checked={selectedItems.map((i) => i._id).includes(item._id)}
							onChange={() => {
								handleToggle(item)
							}}
						/>
						<span className="ml-2">{item.name}</span>
					</div>
				))}
			</div>
			<div className="flex justify-center gap-4">
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
