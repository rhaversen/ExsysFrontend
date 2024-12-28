import QuantityAdjustButton from '@/components/kiosk/cart/QuantityAdjustButton'
import { type ReactElement } from 'react'

const QuantityAdjuster = ({
	quantity,
	onQuantityChange
}: {
	quantity: number
	onQuantityChange: (change: number) => void
}): ReactElement => {
	return (
		<div className="inline-flex items-center ring-4 ring-blue-400 rounded-full ring-inset">
			<div className="flex items-center">
				<QuantityAdjustButton
					onClick={() => {
						onQuantityChange(-1)
					}}
					text="-"
				/>
				<div className="w-10 text-2xl font-extrabold bg-transparent text-center text-blue-600">
					{quantity}
				</div>
				<QuantityAdjustButton
					onClick={() => {
						onQuantityChange(1)
					}}
					text="+"
				/>
			</div>
		</div>
	)
}

export default QuantityAdjuster
