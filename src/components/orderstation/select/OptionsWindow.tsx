import Option from '@/components/orderstation/select/Option'
import CloseableModal from '@/components/ui/CloseableModal'
import { type OptionType } from '@/types/backendDataTypes'
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
		<CloseableModal onClose={onClose}>
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
						price: 0,
						createdAt: '',
						updatedAt: ''
					}}
					onOptionSelect={onClose}
				/>
			</div>
		</CloseableModal>
	)
}

export default OptionsWindow
