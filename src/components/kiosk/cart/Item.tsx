import QuantityAdjuster from '@/components/kiosk/cart/QuantityAdjuster'
import AsyncImage from '@/components/ui/AsyncImage'
import { type OptionType, type ProductType } from '@/types/backendDataTypes'
import React, { type ReactElement, useCallback } from 'react'
import { KioskImages } from '@/lib/images'

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
			<div className="flex flex-row justify-evenly pb-1">
				<h3 className="text-xl font-bold text-gray-800">
					{name}
				</h3>
				<p className="text-lg font-semibold text-gray-800 italic">
					{price === 0 ? 'Gratis' : `${price * quantity} kr`}
				</p>
			</div>
			<div className="flex flex-row justify-evenly">
				<AsyncImage
					className="w-16 h-16"
					width={40}
					height={40}
					quality={40}
					src={`${imageURL === undefined || imageURL === '' ? KioskImages.noUrl.src : imageURL}`} alt={name}
					draggable={false}
					priority={true}
				/>
				<QuantityAdjuster
					quantity={quantity}
					onQuantityChange={handleQuantityChange}
				/>
			</div>
		</div>
	)
}

export default Item
