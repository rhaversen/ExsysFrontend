import { type ReactElement, useCallback } from 'react'

import QuantityAdjuster from '@/components/kiosk/cart/QuantityAdjuster'
import AsyncImage from '@/components/ui/AsyncImage'
import { useAnalytics } from '@/contexts/AnalyticsProvider'
import { KioskImages } from '@/lib/images'
import { type OptionType, type ProductType } from '@/types/backendDataTypes'

const Item = ({
	imageURL,
	id,
	name,
	price,
	type,
	quantity,
	onQuantityChange
}: {
	imageURL?: ProductType['imageURL'] | OptionType['imageURL']
	id: ProductType['_id'] | OptionType['_id']
	name: ProductType['name'] | OptionType['name']
	price: ProductType['price'] | OptionType['price']
	type: 'products' | 'options'
	quantity: number
	onQuantityChange: (change: number) => void
}): ReactElement => {
	const { track } = useAnalytics()
	const isProduct = type === 'products'

	const handleQuantityChange = useCallback((change: number): void => {
		const metadata = isProduct ? { productId: id } : { optionId: id }
		if (change > 0) {
			track(isProduct ? 'product_increase' : 'option_increase', metadata)
		} else {
			track(isProduct ? 'product_decrease' : 'option_decrease', metadata)
		}
		onQuantityChange(change)
	}, [onQuantityChange, id, track, isProduct])

	return (
		<div className="flex items-center gap-2 px-3 py-2">
			<AsyncImage
				className="w-12 h-12 rounded-xl shrink-0"
				width={48}
				height={48}
				quality={75}
				src={`${imageURL === undefined || imageURL === '' ? KioskImages.noUrl.src : imageURL}`}
				alt={name}
				draggable={false}
				priority={true}
			/>
			<div className="flex-1 min-w-0">
				<p className="font-bold text-gray-800 truncate">{name}</p>
				<p className="text-sm text-gray-500">
					{price === 0 ? 'Gratis' : `${price} kr`}
				</p>
			</div>
			<QuantityAdjuster
				quantity={quantity}
				onQuantityChange={handleQuantityChange}
			/>
		</div>
	)
}

export default Item
