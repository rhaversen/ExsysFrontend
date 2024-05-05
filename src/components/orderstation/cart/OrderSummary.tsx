import React, { type ReactElement } from 'react'
import { type ProductType, type OptionType, type CartType } from '@/lib/backendDataTypes'
import Item from '@/components/orderstation/cart/Item'

const OrderSummary = ({
	products,
	options,
	cart,
	onCartChange
}: {
	products: ProductType[]
	options: OptionType[]
	cart: CartType
	onCartChange: (_id: string, type: 'products' | 'options', quantity: number) => void
}): ReactElement => {
	// Combine products and options into one array
	const cartItems = [...Object.entries(cart.products), ...Object.entries(cart.options)].map(([id, quantity]) => {
		// Find the item in either products or options
		const item = products.find((p) => p._id === id) ?? options.find((o) => o._id === id)
		// If the item is not found, throw an error
		if (item === undefined) {
			throw new Error(`Item with id ${id} not found`)
		}
		// Determine if the item is a product or an option
		const type: 'products' | 'options' = item._id in cart.products ? 'products' : 'options'
		return {
			id,
			name: item.name,
			price: item.price,
			type,
			quantity,
			imageURL: item.imageURL
		}
	})

	return (
		<div>
			{cartItems.map((item) => {
				return (
					<Item
						key={item.id}
						imageURL={item.imageURL}
						id={item.id}
						name={item.name}
						price={item.price}
						type={item.type}
						quantity={item.quantity}
						onCartChange={onCartChange}
					/>
				)
			})}
		</div>
	)
}

export default OrderSummary
