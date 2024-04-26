import React, { useState } from 'react'
import QuantityAdjuster from '@/components/ui/QuantityAdjuster'
import { OrderWindow } from '@/lib/timeUtils'

const Product = ({
	id,
	initialQuantity,
	name,
	description,
	price,
	disabled,
	orderWindow,
	onQuantityChange,
}: {
	id: string
	initialQuantity: number
	name: string
	description: string
	price: number
	disabled: boolean
	orderWindow: OrderWindow
	onQuantityChange: (id: string, quantity: number) => void
}) => {
	const [quantity, setQuantity] = useState(initialQuantity)

	const handleQuantityChange = (newQuantity: number) => {
		setQuantity(newQuantity)
		onQuantityChange(id, newQuantity)
	}

	return (
		<div
			className={`p-10 mx-auto shadow-md flex flex-row items-center space-x-5 ${disabled
				? 'text-gray-500 bg-gray-400 bg-opacity-50'
				: 'text-black'
			}`}
		>
			<div className="ml-10 flex-grow">
				<h2 className="text-xl font-semibold">{name}</h2>
				<p className="text-gray-600 mt-2">{description}</p>
				<p className="text-gray-600 mt-2 text-sm">
					{orderWindow.from.hour.toString().padStart(2, '0')}:{orderWindow.from.minute.toString().padStart(2, '0')}
					{' - '}
					{orderWindow.to.hour.toString().padStart(2, '0')}:{orderWindow.to.minute.toString().padStart(2, '0')}
				</p>
			</div>
			<div className="flex flex-col items-center">
				<p className="mt-2 mb-2">Pris: {price} kr</p>
				<QuantityAdjuster
					disabled={disabled}
					quantity={quantity}
					setQuantity={handleQuantityChange}
				/>
			</div>
		</div>
	)
}

export default Product
