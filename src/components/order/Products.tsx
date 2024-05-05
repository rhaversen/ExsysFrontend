import React, { type ReactElement } from 'react'
import Product from '@/components/order/Product'
import { convertOrderWindowFromUTC, type OrderWindow } from '@/lib/timeUtils'

interface ProductProps {
	_id: string
	name: string
	description: string
	price: number
	orderWindow: OrderWindow
}

const Products = ({
	products,
	quantities,
	availabilities,
	onQuantityChange
}: {
	products: ProductProps[]
	quantities: Record<string, number>
	availabilities: Record<string, boolean>
	onQuantityChange: (key: string, newQuantity: number) => void
}): ReactElement => {
	return (
		<div>
			{products.map((product) => (
				<Product
					key={product._id}
					id={product._id}
					initialQuantity={quantities[product._id]}
					name={product.name}
					description={product.description}
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
