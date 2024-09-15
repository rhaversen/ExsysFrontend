import CloseableModal from '@/components/ui/CloseableModal'
import { type ReactElement, useCallback, useState } from 'react'

const ConfirmDeletion = ({
	itemName,
	onClose,
	onSubmit
}: {
	itemName: string
	onClose: () => void
	onSubmit: (confirm: boolean) => void
}): ReactElement => {
	const [confirmDeletion, setConfirmDeletion] = useState(false)

	const handleSubmit = useCallback((): void => {
		onSubmit(confirmDeletion)
	}, [confirmDeletion, onSubmit])

	return (
		<CloseableModal onClose={onClose}>
			<h2 className="text-lg font-bold text-gray-800">{`Er du sikker på du vil slette ${itemName}?`}</h2>
			<div className="flex items-center justify-center p-4">
				<label className="text-gray-800 gap-2 flex justify-center cursor-pointer">
					<input
						type="checkbox"
						checked={confirmDeletion}
						onChange={(e) => {
							setConfirmDeletion(e.target.checked)
						}}
					/>
					{'Bekræft sletning'}
				</label>
			</div>
			<div className="flex justify-center gap-4">
				<button
					type="button"
					className="bg-blue-500 hover:bg-blue-600 text-white rounded-md py-2 px-4"
					onClick={onClose}
				>
					{'Annuller'}
				</button>
				<button
					type="button"
					className={`${confirmDeletion ? 'bg-red-500 hover:bg-red-600' : 'bg-red-400'} text-white rounded-md py-2 px-4`}
					disabled={!confirmDeletion}
					onClick={handleSubmit}
				>
					{'Slet ' + itemName}
				</button>
			</div>
		</CloseableModal>
	)
}

export default ConfirmDeletion
