import React, { type ReactElement } from 'react'
import Product from '@/components/order/Product'
import { convertOrderWindowFromUTC } from '@/lib/timeUtils'
import { type OptionType, type ProductType } from '@/lib/backendDataTypes'

const Products = ({
	products,
	quantities,
	availabilities,
	onQuantityChange
}: {
	products: ProductType[]
	quantities: Record<ProductType['_id'] | OptionType['_id'], number>
	availabilities: Record<ProductType['_id'], boolean>
	onQuantityChange: (key: ProductType['_id'] | OptionType['_id'], newQuantity: number) => void
}): ReactElement => {
	return (
		<div>
			{products.map((product) => (
				<Product
					key={product._id}
					id={product._id}
					initialQuantity={quantities[product._id]}
					name={product.name}
					price={product.price}
					onQuantityChange={onQuantityChange}
					disabled={!availabilities[product._id]}
					orderWindow={convertOrderWindowFromUTC(product.orderWindow)}
				/>
			))}
		</div>
	)
}

export default Products
