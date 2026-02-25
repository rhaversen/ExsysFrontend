import { type ReactElement } from 'react'

import QuantityAdjustButton from '@/components/kiosk/cart/QuantityAdjustButton'

const QuantityAdjuster = ({
	quantity,
	onQuantityChange
}: {
	quantity: number
	onQuantityChange: (change: number) => void
}): ReactElement => {
	return (
		<div className="inline-flex items-center ring-2 ring-blue-400 rounded-full shrink-0">
			<QuantityAdjustButton
				onClick={() => {
					onQuantityChange(-1)
				}}
				text="-"
			/>
			<div className="w-6 text-lg font-extrabold text-center text-blue-600">
				{quantity}
			</div>
			<QuantityAdjustButton
				onClick={() => {
					onQuantityChange(1)
				}}
				text="+"
			/>
		</div>
	)
}

export default QuantityAdjuster
