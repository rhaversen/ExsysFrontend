import { type OptionType } from '@/lib/backendDataTypes'
import { type ReactElement } from 'react'

const OptionsWindow = ({
	productName,
	options,
	productOptions,
	onAddOption,
	onDeleteOption,
	onClose
}: {
	productName: string
	options: OptionType[]
	productOptions: OptionType[]
	onAddOption: (v: OptionType) => void
	onDeleteOption: (v: OptionType) => void
	onClose: () => void
}): ReactElement => {
	const handleToggle = (option: OptionType): void => {
		if (productOptions.map((option) => option._id).includes(option._id)) {
			onDeleteOption(option)
		} else {
			onAddOption(option)
		}
	}

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black/50 z-10">
			<button
				type="button"
				className="absolute inset-0 w-full h-full"
				onClick={onClose}
			>
				<span className="sr-only">
					{'Close'}
				</span>
			</button>
			<div className="absolute bg-white rounded-3xl p-10">
				<h2 className="text-lg font-bold text-black">{`Tilføj tilvalg til ${productName}`}</h2>
				<div className="bg-white shadow-md p-2 rounded">
					{options.map((option) => (
						<div key={option._id} className="flex flex-wrap flex-row items-center p-1 mb-2 text-black">
							<input
								title='Add Option'
								type="checkbox"
								className='cursor-pointer'
								checked={productOptions.map((option) => option._id).includes(option._id)}
								onChange={() => { handleToggle(option) }}
							/>
							<span className="ml-2">{option.name}</span>
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
			</div>
		</div>
	)
}

export default OptionsWindow
