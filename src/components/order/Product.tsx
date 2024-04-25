import React, { useState } from 'react'
import QuantityAdjuster from '@/components/ui/QuantityAdjuster'

const Product = ({
	id,
	initialQuantity,
	name,
	description,
	price,
	onQuantityChange,
}: {
	id: string;
	initialQuantity: number;
	name: string;
	description: string;
	price: number;
	onQuantityChange: (id: string, quantity: number) => void;
}) => {
	const [quantity, setQuantity] = useState(initialQuantity)

	const handleQuantityChange = (newQuantity: number) => {
		setQuantity(newQuantity)
		onQuantityChange(id, newQuantity)
	}

	return (
		<div className="p-6 mx-auto bg-transparent shadow-md flex flex-row items-start space-x-4 text-black">
			<div className="flex-grow">
				<h2 className="text-xl font-semibold">{name}</h2>
				<p className="text-gray-500">{description}</p>
			</div>
			<div className="flex flex-col items-center">
				<p className="mt-2 mb-2">Pris: {price} kr</p>
				<QuantityAdjuster
					quantity={quantity}
					setQuantity={handleQuantityChange}
				/>
			</div>
		</div>
	)
}

export default Product
