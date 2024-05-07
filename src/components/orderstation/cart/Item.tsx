import React, { type ReactElement, useCallback } from 'react'
import Image from 'next/image'
import QuantityAdjuster from '@/components/orderstation/cart/QuantityAdjuster'
import { type OptionType, type ProductType } from '@/lib/backendDataTypes'

const Item = ({
	imageURL,
	id,
	name,
	price,
	type,
	quantity,
	onCartChange
}: {
	imageURL?: ProductType['imageURL'] | OptionType['imageURL']
	id: ProductType['_id'] | OptionType['_id']
	name: ProductType['name'] | OptionType['name']
	price: ProductType['price'] | OptionType['price']
	type: 'products' | 'options'
	quantity: number
	onCartChange: (_id: ProductType['_id'] | OptionType['_id'], type: 'products' | 'options', quantity: number) => void
}): ReactElement => {
	const handleQuantityChange = useCallback((change: number): void => {
		onCartChange(id, type, change)
	}, [onCartChange, id, type])

	return (
		<div className="py-3 shadow-md">
			<h3 className="font-bold text-black text-center pb-1">
				{name}
			</h3>
			<div className="flex flex-row items-center justify-between">
				<Image
					width={80}
					height={80}
					src={`${imageURL === undefined || imageURL === '' ? '/none.svg' : imageURL}`}
					alt={name}
					className="w-12 h-12 object-cover text-black mx-auto"
					draggable="false"
					priority // Load image immediately
				/>
				<QuantityAdjuster
					quantity={quantity}
					onQuantityChange={handleQuantityChange}
				/>
				<p className="italic text-gray-700 w-12 h-12 mx-auto flex items-center justify-center">{price === 0 ? 'Gratis' : `${price * quantity} kr`}</p>
			</div>
		</div>
	)
}

export default Item
