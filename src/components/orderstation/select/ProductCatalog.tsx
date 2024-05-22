import Product from '@/components/orderstation/select/Product'
import { type ProductType } from '@/lib/backendDataTypes'
import { isCurrentTimeInOrderWindow } from '@/lib/timeUtils'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import { useInterval } from 'react-use'

const ProductCatalog = ({
	products,
	onProductSelect
}: {
	products: ProductType[]
	onProductSelect: (product: ProductType) => void
}): ReactElement => {
	const [productAvailabilities, setProductAvailabilities] = useState<Record<ProductType['_id'], boolean>>({})

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

	// Initial update of product availabilities
	useEffect(() => {
		updateProductAvailabilities()
	}, [updateProductAvailabilities])

	useInterval(updateProductAvailabilities, 1000 * 10) // Update product availabilities every 10 seconds

	return (
		<div className="flex flex-wrap justify-between mx-5">
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
