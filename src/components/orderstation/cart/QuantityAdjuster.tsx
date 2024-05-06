import QuantityAdjustButton from '@/components/orderstation/cart/QuantityAdjustButton'
import { type ReactElement } from 'react'

const QuantityAdjuster = ({
	quantity,
	onQuantityChange
}: {
	quantity: number
	onQuantityChange: (change: number) => void
}): ReactElement => {
	return (
		<div className={'inline-flex items-center border-2 px-1 py-1 rounded-full border-blue-500'}>
			<div className="flex items-center">
				<QuantityAdjustButton
					onClick={() => {
						onQuantityChange(-1)
					}}
					text="-"
				/>
				<input
					aria-label="Mængde"
					className={'w-10 bg-transparent text-center select-all text-blue-500'}
					type="text"
					value={quantity}
					readOnly
					onFocus={(event) => {
						event.target.blur()
					}}
				/>
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
