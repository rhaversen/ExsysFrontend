import Option from '@/components/orderstation/select/Option'
import { type OptionType } from '@/lib/backendDataTypes'
import React, { type ReactElement } from 'react'

const OptionsWindow = ({
	productOptions,
	onOptionSelect,
	onClose
}: {
	productOptions: OptionType[]
	onOptionSelect: (option: OptionType) => void
	onClose: () => void
}): ReactElement => {
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
			<div
				className="bg-white rounded-3xl p-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
				<h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
					{'Tilvalg'}
				</h2>
				<div className="flex flex-wrap justify-center gap-4">
					{productOptions.map((option) => (
						<Option
							key={option._id}
							option={option}
							onOptionSelect={onOptionSelect}
						/>
					))}
					<Option
						option={{
							_id: 'none',
							name: 'Intet',
							imageURL: '/none.svg',
							price: 0
						}}
						onOptionSelect={onClose}
					/>
				</div>
			</div>
		</div>
	)
}

export default OptionsWindow
