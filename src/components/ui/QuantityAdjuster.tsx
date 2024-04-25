import QuantityAdjustButton from '@/components/ui/QuantityAdjustButton'

const QuantityAdjuster = ({
	quantity = 0,
	available,
	setQuantity,
}: {
	quantity: number
	available: boolean
	setQuantity: (newQuantity: number) => void
}) => {
	return (
		<div
			className={`inline-flex items-center border-2 px-1 py-1 rounded-full ${
				available ? 'border-blue-500' : 'border-gray-400'
			}`}
		>
			<div className="flex items-center">
				<QuantityAdjustButton
					onClick={() => setQuantity(Math.max(0, quantity - 1))}
					text="-"
					available={available}
				/>
				<label htmlFor="quantityInput" className="sr-only">
					Mængde
				</label>
				<input
					id="quantityInput"
					className={`w-16 bg-transparent text-center text-black select-all ${
						available ? 'text-blue-500' : 'text-gray-500'
					}`}
					type="text"
					value={quantity}
					readOnly
					onFocus={(event) => event.target.blur()}
				/>
				<QuantityAdjustButton
					onClick={() => setQuantity(quantity + 1)}
					text="+"
					available={available}
				/>
			</div>
		</div>
	)
}

export default QuantityAdjuster
