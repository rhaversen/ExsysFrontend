import { type ReactElement } from 'react'

import AsyncImage from '@/components/ui/AsyncImage'
import { KioskImages } from '@/lib/images'
import { type ProductType } from '@/types/backendDataTypes'

import AmountIndicator from './AmountIndicator'

const Product = ({
	product,
	disabled,
	amount = 0,
	onProductSelect
}: {
	product: ProductType
	disabled: boolean
	amount?: number
	onProductSelect: (product: ProductType) => void
}): ReactElement => {
	return (
		<div className="relative flex flex-col items-center justify-center bg-white shadow-md rounded-3xl p-2 m-2">
			{disabled &&
				<div className="absolute top-0 left-0 w-full h-full bg-gray-700 opacity-50 z-10 rounded" />
			}
			<button
				type="button"
				className="cursor-pointer"
				onClick={() => {
					onProductSelect(product)
				}}
				draggable="false"
				disabled={disabled}
			>
				<div className="flex flex-row items-center justify-center">
					<h3 className={`font-bold text-2xl pr-2 ${disabled ? 'text-gray-500' : 'text-gray-800'}`}>
						{product.name}
					</h3>
					<p className={`italic text-2xl ${disabled ? 'text-gray-500' : 'text-gray-800'}`}>
						{product.price === 0 ? 'Gratis' : `${product.price} kr`}
					</p>
				</div>
				<AsyncImage
					className="w-60 h-60 mx-auto"
					width={100}
					height={100}
					quality={80}
					src={`${product.imageURL === undefined || product.imageURL === '' ? KioskImages.noUrl.src : product.imageURL}`}
					alt={product.name}
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
	)
}

export default Product
