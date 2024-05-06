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
		<div className="p-2 m-2 relative">
			<h3 className="font-bold text-black text-center">
				{name}
			</h3>
			<div className="flex flex-row items-center justify-center">
				<Image
					width={80}
					height={80}
					src={`${imageURL === undefined || imageURL === '' ? '/none.svg' : imageURL}`}
					alt={name}
					className="w-20 h-20 object-cover text-black"
					draggable="false"
					priority // Load image immediately
				/>
				<QuantityAdjuster
					quantity={quantity}
					onQuantityChange={handleQuantityChange}
				/>
				<p className="italic text-gray-700 w-20 text-center">{price === 0 ? 'Gratis' : `${price} kr`}</p>
			</div>
		</div>
	)
}

export default Item
