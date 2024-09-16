import Item from '@/components/orderstation/cart/Item'
import { type OptionType, type ProductType } from '@/types/backendDataTypes'
import { type CartItemType, type CartType } from '@/types/frontendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'

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
	const [prevCartLength, setPrevCartLength] = useState(cartItems.length)

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
				imageURL: item.imageURL
			}
		})
	}, [cart, products, options])

	// Update the cart items when the cart changes
	useEffect(() => {
		const newCartItems = getCartItems()
		setCartItems(newCartItems)
	}, [cart, getCartItems, setCartItems])

	useEffect(() => {
		const cartLengthIncreased = cartItems.length > prevCartLength
		setPrevCartLength(cartItems.length)
		if (cartLengthIncreased) {
			endOfCartRef.current?.scrollIntoView({ behavior: 'smooth' })
		}
	}, [cartItems, endOfCartRef, prevCartLength])

	return (
		<div className="pt-2">
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
