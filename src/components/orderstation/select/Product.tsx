import React, { type ReactElement } from 'react'
import Image from 'next/image'
import { type ProductType } from '@/lib/backendDataTypes'

const Product = ({
	product,
	disabled,
	onProductSelect
}: {
	product: ProductType
	disabled: boolean
	onProductSelect: (product: ProductType) => void
}): ReactElement => {
	return (
		<div className="p-2 mx-auto">
			<div className="relative">
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
						<h3 className={`font-bold pr-2 ${disabled ? 'text-gray-500' : 'text-black'}`}>
							{product.name}
						</h3>
						<p className={`italic ${disabled ? 'text-gray-500' : 'text-gray-700'}`}>
							{product.price === 0 ? 'Gratis' : `${product.price} kr`}
						</p>
					</div>
					<div className={`${disabled ? 'text-gray-500' : 'text-gray-700'}`}>
						{product.orderWindow.from.hour.toString().padStart(2, '0')}:{product.orderWindow.from.minute.toString().padStart(2, '0')}
						{' - '}
						{product.orderWindow.to.hour.toString().padStart(2, '0')}:{product.orderWindow.to.minute.toString().padStart(2, '0')}
					</div>
					<Image
						width={100}
						height={100}
						quality={80}
						src={`${product.imageURL === undefined || product.imageURL === '' ? '/none.svg' : product.imageURL}`}
						alt={product.name}
						className="w-48 h-48 object-cover text-black"
						draggable="false"
						priority // Load image immediately
					/>
				</button>
			</div>
		</div>
	)
}

export default Product
