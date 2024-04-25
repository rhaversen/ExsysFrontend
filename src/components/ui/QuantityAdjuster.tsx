import QuantityAdjustButton from '@/components/ui/QuantityAdjustButton'

const QuantityAdjuster = ({
	quantity = 0,
	setQuantity,
}: {
	quantity: number;
	setQuantity: (newQuantity: number) => void;
}) => {
	return (
		<div className="inline-flex items-center border-2 px-1 py-1 border-blue-500 rounded-full">
			<div className="flex items-center">
				<QuantityAdjustButton
					onClick={() => setQuantity(Math.max(0, quantity - 1))}
					text="-"
				/>
				<label htmlFor="quantityInput" className="sr-only">
					Mængde
				</label>
				<input
					id="quantityInput"
					className="w-16 bg-transparent text-center text-black select-all"
					type="text"
					value={quantity}
					readOnly
					onFocus={(event) => event.target.blur()}
				/>
				<QuantityAdjustButton
					onClick={() => setQuantity(quantity + 1)}
					text="+"
				/>
			</div>
		</div>
	)
}

export default QuantityAdjuster
