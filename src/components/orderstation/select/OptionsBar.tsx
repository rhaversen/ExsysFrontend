import Option from '@/components/orderstation/select/Option'
import { type OptionType } from '@/types/backendDataTypes'
import { type CartType } from '@/types/frontendDataTypes'
import React, { type ReactElement } from 'react'

const OptionsBar = ({
	cart,
	options,
	onOptionSelect
}: {
	cart: CartType
	options: OptionType[]
	onOptionSelect: (option: OptionType) => void
}): ReactElement => {
	return (
		<div className="flex flex-row">
			{options.map((option) => (
				<Option
					key={option._id}
					option={option}
					onOptionSelect={onOptionSelect}
					amount={cart.options[option._id]}
				/>
			))}
		</div>
	)
}

export default OptionsBar
