import Product from '@/components/orderstation/select/Product'
import { isCurrentTimeInOrderWindow } from '@/lib/timeUtils'
import { type ProductType } from '@/app/orderstation/[room]/page'
import React, { useCallback, useEffect, useState } from 'react'

const ProductCatalog = ({
	products,
	onProductSelect
}: {
	products: ProductType[]
	onProductSelect: (product: ProductType) => void
}) => {
	const [productAvailabilities, setProductAvailabilities] = useState<Record<string, boolean>>({})

	const updateProductAvailabilities = useCallback(() => {
		setProductAvailabilities(
			products.reduce(
				(acc, product) => ({
					...acc,
					[product._id]: isCurrentTimeInOrderWindow(product.orderWindow)
				}),
				{}
			)
		)
	}, [products])

	useEffect(() => {
		updateProductAvailabilities()
	}, [updateProductAvailabilities])

	useEffect(() => {
		const interval = setInterval(() => { updateProductAvailabilities() }, 10000)
		return () => {
			clearInterval(interval)
		}
	}, [products, updateProductAvailabilities])

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
