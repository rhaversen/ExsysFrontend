import Product from '@/components/kiosk/select/Product'
import { isCurrentTimeInOrderWindow } from '@/lib/timeUtils'
import { type ProductType } from '@/types/backendDataTypes'
import { type CartType } from '@/types/frontendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import { useInterval } from 'react-use'

const ProductCatalog = ({
	cart,
	products,
	onProductSelect
}: {
	cart: CartType
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
		<div className="
		grid
		grid-cols-[repeat(auto-fit,minmax(100px,1fr))]
		sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]
		md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]
		lg:grid-cols-[repeat(auto-fit,minmax(250px,1fr))]
		place-items-center
	  ">
			{products
				.filter(product => productAvailabilities[product._id])
				.map((product) => (
					<Product
						key={product._id}
						product={product}
						disabled={!productAvailabilities[product._id]}
						onProductSelect={onProductSelect}
						amount={cart.products[product._id]}
					/>
				))}
		</div>
	)
}

export default ProductCatalog
