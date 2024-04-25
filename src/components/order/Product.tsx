import React, { useState } from 'react'
import QuantityAdjuster from '@/components/ui/QuantityAdjuster'

const Product = ({
	id,
	initialQuantity,
	name,
	description,
	price,
	available,
	onQuantityChange,
}: {
	id: string
	initialQuantity: number
	name: string
	description: string
	price: number
	available: boolean
	onQuantityChange: (id: string, quantity: number) => void
}) => {
	const [quantity, setQuantity] = useState(initialQuantity)

	const handleQuantityChange = (newQuantity: number) => {
		setQuantity(newQuantity)
		onQuantityChange(id, newQuantity)
	}

	return (
		<div
			className={`p-10 mx-auto shadow-md flex flex-row items-center space-x-5 ${
				available
					? 'text-black'
					: 'text-gray-500 bg-gray-400 bg-opacity-50'
			}`}
		>
			<div className="ml-10 flex-grow">
				<h2 className="text-xl font-semibold">{name}</h2>
				<p className="text-gray-500">{description}</p>
			</div>
			<div className="flex flex-col items-center">
				<p className="mt-2 mb-2">Pris: {price} kr</p>
				<QuantityAdjuster
					available={available}
					quantity={quantity}
					setQuantity={handleQuantityChange}
				/>
			</div>
		</div>
	)
}

export default Product
