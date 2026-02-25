import { type ReactElement } from 'react'

import Option from '@/components/kiosk/select/Option'
import { type OptionType } from '@/types/backendDataTypes'

/**
 * @deprecated OptionsBar is no longer used. Options are now shown inline in the cart below each product.
 */
const OptionsBar = ({
	options,
	onOptionSelect
}: {
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
				/>
			))}
		</div>
	)
}

export default OptionsBar
