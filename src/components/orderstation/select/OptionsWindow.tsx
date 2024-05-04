import React from 'react'
import { OptionType, ProductType } from '@/app/orderstation/[room]/page'
import Option from '@/components/orderstation/select/Option'

const OptionsWindow = ({
	options,
	onOptionSelect,
}: {
	options: OptionType[]
	onOptionSelect: (_id: string) => void
}) => {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-transparent z-10">
			<div className="bg-white rounded-3xl p-10">
				<h2 className="text-2xl font-bold mb-4 text-center text-black">Tilvalg</h2>
				<div className="flex flex-wrap justify-center gap-4">
					{options.map((option) => (
						<Option
							key={option._id}
							option={option}
							onOptionSelect={onOptionSelect}
						/>
					))}
				</div>
			</div>
		</div>
	)
}

export default OptionsWindow
