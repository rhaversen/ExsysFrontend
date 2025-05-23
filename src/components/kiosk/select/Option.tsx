import { type ReactElement } from 'react'

import AsyncImage from '@/components/ui/AsyncImage'
import { KioskImages } from '@/lib/images'
import { type OptionType } from '@/types/backendDataTypes'

import AmountIndicator from './AmountIndicator'

const Option = ({
	option,
	amount = 0,
	onOptionSelect
}: {
	option: OptionType
	amount?: number
	onOptionSelect: (option: OptionType) => void
}): ReactElement => {
	return (
		<div className="p-2">
			<div className="relative">
				<button
					type="button"
					className="cursor-pointer"
					onClick={() => {
						onOptionSelect(option)
					}}
					draggable="false"
				>
					<div className="flex flex-row items-center justify-center">
						<h3 className="font-bold pr-2 text-gray-800">{option.name}</h3>
						<p className="italic text-gray-800">
							{option.price === 0 ? 'Gratis' : `${option.price} kr`}
						</p>
					</div>
					<AsyncImage
						className="w-40 h-40"
						width={100}
						height={100}
						quality={80}
						src={`${option.imageURL === undefined || option.imageURL === '' ? KioskImages.noUrl.src : option.imageURL}`}
						alt={option.name}
						draggable={false}
						priority={true}
					/>
				</button>
				{amount > 0 && (
					<div className="absolute bottom-5 right-5">
						<AmountIndicator
							amount={amount}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

export default Option
