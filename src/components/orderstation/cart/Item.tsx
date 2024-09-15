import QuantityAdjuster from '@/components/orderstation/cart/QuantityAdjuster'
import AsyncImage from '@/components/ui/AsyncImage'
import { type OptionType, type ProductType } from '@/types/backendDataTypes'
import React, { type ReactElement, useCallback } from 'react'

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
		<div className="py-3">
			<h3 className="font-bold text-gray-800 text-center pb-1">
				{name}
			</h3>
			<div className="flex flex-row items-center justify-between">
				<AsyncImage
					className="w-12 h-12"
					width={40}
					height={40}
					quality={40}
					src={`${imageURL === undefined || imageURL === '' ? '/none.svg' : imageURL}`}
					alt={name}
					draggable={false}
					priority={true}
				/>
				<QuantityAdjuster
					quantity={quantity}
					onQuantityChange={handleQuantityChange}
				/>
				<p className="italic text-gray-800 w-12 h-12 mx-auto flex items-center justify-center">{price === 0 ? 'Gratis' : `${price * quantity} kr`}</p>
			</div>
		</div>
	)
}

export default Item
