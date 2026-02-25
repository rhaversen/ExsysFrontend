import { type ReactElement, useCallback } from 'react'

import QuantityAdjustButton from '@/components/kiosk/cart/QuantityAdjustButton'
import QuantityAdjuster from '@/components/kiosk/cart/QuantityAdjuster'
import AsyncImage from '@/components/ui/AsyncImage'
import { useAnalytics } from '@/contexts/AnalyticsProvider'
import { KioskImages } from '@/lib/images'
import { type OptionType } from '@/types/backendDataTypes'

const OptionRow = ({
	option,
	quantity,
	onQuantityChange
}: {
	option: OptionType
	quantity: number
	onQuantityChange: (change: number) => void
}): ReactElement => {
	const { track } = useAnalytics()

	const handleChange = useCallback((change: number): void => {
		if (change > 0) {
			track(quantity === 0 ? 'option_select' : 'option_increase', { optionId: option._id })
		} else {
			track('option_decrease', { optionId: option._id })
		}
		onQuantityChange(change)
	}, [onQuantityChange, option._id, quantity, track])

	return (
		<div className="flex items-center gap-2 py-1 px-3">
			<AsyncImage
				className="w-8 h-8 rounded-lg"
				width={32}
				height={32}
				quality={75}
				src={option.imageURL === undefined || option.imageURL === '' ? KioskImages.noUrl.src : option.imageURL}
				alt={option.name}
				draggable={false}
				priority={true}
			/>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-gray-600">{option.name}</p>
				<p className="text-xs text-gray-400">
					{option.price === 0 ? 'Gratis' : `+${option.price} kr`}
				</p>
			</div>
			{quantity > 0
				? (
					<QuantityAdjuster
						quantity={quantity}
						onQuantityChange={handleChange}
					/>
				)
				: (
					<QuantityAdjustButton
						onClick={() => { handleChange(1) }}
						text="+"
					/>
				)
			}
		</div>
	)
}

export default OptionRow
