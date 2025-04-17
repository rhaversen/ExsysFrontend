import React, { type ReactElement, useCallback, useState } from 'react'

import QuantityAdjuster from '@/components/ui/QuantityAdjuster'
import { type OrderWindow, type ProductType } from '@/types/backendDataTypes'

const Product = ({
	id,
	initialQuantity,
	name,
	price,
	disabled,
	orderWindow,
	onQuantityChange
}: {
	id: ProductType['_id']
	initialQuantity: number
	name: ProductType['name']
	price: ProductType['price']
	disabled: boolean
	orderWindow: OrderWindow
	onQuantityChange: (id: ProductType['_id'], quantity: number) => void
}): ReactElement => {
	const [quantity, setQuantity] = useState(initialQuantity)

	const handleQuantityChange = useCallback((newQuantity: number): void => {
		setQuantity(newQuantity)
		onQuantityChange(id, newQuantity)
	}, [id, onQuantityChange])

	return (
		<div
			className={`p-10 mx-auto shadow-md flex flex-row items-center space-x-5 ${disabled
				? 'text-gray-500 bg-gray-400 bg-opacity-50'
				: 'text-gray-800'
			}`}
		>
			<div className="ml-10 flex-grow">
				<h2 className="text-xl font-semibold">{name}</h2>
				<p className="text-gray-800 mt-2 text-sm">
					{orderWindow.from.hour.toString().padStart(2, '0')}{':'}{orderWindow.from.minute.toString().padStart(2, '0')}
					{' - '}
					{orderWindow.to.hour.toString().padStart(2, '0')}{':'}{orderWindow.to.minute.toString().padStart(2, '0')}
				</p>
			</div>
			<div className="flex flex-col items-center">
				<p className="mt-2 mb-2">{'Pris: '}{price}{' kr'}</p>
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
