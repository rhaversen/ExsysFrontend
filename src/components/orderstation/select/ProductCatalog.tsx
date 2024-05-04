import Product from '@/components/orderstation/select/Product'
import { OrderWindow, isCurrentTimeInOrderWindow } from '@/lib/timeUtils'
import { type ProductType } from '@/app/orderstation/[room]/page'
import React, { useEffect, useState } from 'react'

const ProductCatalog = ({
	products,
	onProductSelect
}: {
	products: ProductType[]
	onProductSelect: (_id: string) => void;
}) => {
	const [productAvailabilities, setProductAvailabilities] = useState<Record<string, boolean>>({})

	const updateProductAvailabilities = () => {
		setProductAvailabilities(
			products.reduce(
				(
					acc: any,
					product: { _id: string; orderWindow: OrderWindow }
				) => ({
					...acc,
					[product._id]: isCurrentTimeInOrderWindow(
						product.orderWindow
					),
				}),
				{}
			)
		)
	}

	useEffect(() => {
		updateProductAvailabilities()
	}, [products])

	useEffect(() => {
		const interval = setInterval(() => updateProductAvailabilities(), 60000)
		return () => {
			clearInterval(interval)
		}
	}, [products])

	return (
		<div className="flex flex-wrap justify-center">
			{products.map((product) => (
				<Product
					key={product._id}
					product={product}
					disabled={!productAvailabilities[product._id]}
					onProductSelect={onProductSelect}
				/>
			))}
		</div>
	)
}

export default ProductCatalog

