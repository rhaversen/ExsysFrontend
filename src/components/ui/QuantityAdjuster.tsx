import QuantityAdjustButton from '@/components/ui/QuantityAdjustButton'

const QuantityAdjuster = ({
	quantity = 0,
	disabled,
	setQuantity,
}: {
	quantity: number
	disabled: boolean
	setQuantity: (newQuantity: number) => void
}) => {
	return (
		<div
			className={`inline-flex items-center border-2 px-1 py-1 rounded-full
			${disabled
			? 'border-gray-400'
			: 'border-blue-500'}
				`}
		>
			<div className="flex items-center">
				<QuantityAdjustButton
					onClick={() => setQuantity(Math.max(0, quantity - 1))}
					text="-"
					disabled={disabled}
				/>
				<label htmlFor="quantityInput" className="sr-only">
					Mængde
				</label>
				<input
					id="quantityInput"
					className={`w-16 bg-transparent text-center text-black select-all
					${disabled
			? 'text-gray-500'
			: 'text-blue-500'}`
					}
					type="text"
					value={quantity}
					readOnly
					onFocus={(event) => event.target.blur()}
				/>
				<QuantityAdjustButton
					onClick={() => setQuantity(quantity + 1)}
					text="+"
					disabled={disabled}
				/>
			</div>
		</div>
	)
}

export default QuantityAdjuster
