import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { type CartType, type OptionType, type ProductType } from '@/lib/backendDataTypes'
import Item from '@/components/orderstation/cart/Item'
import { type CartItemType } from '@/lib/frontendDataTypes'

const OrderSummary = ({
	products,
	options,
	cart,
	onCartChange
}: {
	products: ProductType[]
	options: OptionType[]
	cart: CartType
	onCartChange: (_id: ProductType['_id'] | OptionType['_id'], type: 'products' | 'options', quantity: number) => void
}): ReactElement => {
	const endOfCartRef = useRef<HTMLDivElement | null>(null)
	const [cartItems, setCartItems] = useState<CartItemType[]>([])

	const getCartItems = useCallback(() => {
		return [...Object.entries(cart.products), ...Object.entries(cart.options)].map(([id, quantity]) => {
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
				imageURL: item.imageURL,
				isNew: true // mark as new item
			}
		})
	}, [cart, products, options])

	// Update the cart items when the cart changes
	useEffect(() => {
		const newCartItems = getCartItems()
		setCartItems((prevItems) => {
			return newCartItems.map((item) => {
				const prevItem = prevItems.find((prevItem) => prevItem.id === item.id)
				return {
					...item,
					isNew: prevItem === undefined // update isNew flag
				}
			})
		})
	}, [cart, getCartItems, setCartItems])

	useEffect(() => {
		const isNewItem = cartItems.some((item) => item.isNew)
		if (isNewItem) {
			endOfCartRef.current?.scrollIntoView({ behavior: 'smooth' })
		}
	}, [cartItems, endOfCartRef])

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
			<div ref={endOfCartRef}></div>
		</div>
	)
}

export default OrderSummary
