import React from 'react'
import Image from 'next/image'
import QuantityAdjuster from '@/components/orderstation/cart/QuantityAdjuster'

const Item = ({
	imageURL,
	id,
	name,
	price,
	type,
	quantity,
	onCartChange
}: {
	imageURL?: string
	id: string
	name: string
	price: number
	type: 'products' | 'options'
	quantity: number
	onCartChange: (_id: string, type: 'products' | 'options', quantity: number) => void
}) => {
	const handleQuantityChange = (change: number) => {
		onCartChange(id, type, change)
	}

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
