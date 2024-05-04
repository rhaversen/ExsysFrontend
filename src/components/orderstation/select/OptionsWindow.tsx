import React from 'react'
import { OptionType } from '@/app/orderstation/[room]/page'
import Option from '@/components/orderstation/select/Option'

const OptionsWindow = ({
	productOptions,
	onOptionSelect,
	onClose
}: {
	productOptions: OptionType[]
	onOptionSelect: (option: OptionType) => void
	onClose: () => void
}) => {
	return (
		<button
			onClick={onClose}
			type='button'
			className="fixed inset-0 flex items-center justify-center bg-black/50 z-10">
			<div className="bg-white rounded-3xl p-10">
				<h2 className="text-2xl font-bold mb-4 text-center text-black">Tilvalg</h2>
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
		</button>
	)
}

export default OptionsWindow
