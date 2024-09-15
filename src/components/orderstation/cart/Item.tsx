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
			<h3 className="text-xl font-bold text-gray-800 text-center pb-2">
				{name}
			</h3>
			<div className="flex flex-row items-center justify-between mx-5">
				<div className="flex-none w-24">
					<AsyncImage
						className="w-16 h-16"
						width={40}
						height={40}
						quality={40}
						src={`${imageURL === undefined || imageURL === '' ? '/none.svg' : imageURL}`} alt={name}
						draggable={false}
						priority={true}
					/>
				</div>

				<div className="flex-grow flex justify-center">
					<QuantityAdjuster
						quantity={quantity}
						onQuantityChange={handleQuantityChange}
					/>
				</div>

				<div className="flex-none w-24 text-right px-5">
					<p className="italic text-xl font-semibold text-gray-800">
						{price === 0 ? 'Gratis' : `${price * quantity} kr`}
					</p>
				</div>
			</div>
		</div>
	)
}

export default Item
