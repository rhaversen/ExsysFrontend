import Item from '@/components/kiosk/cart/Item'
import { type OptionType, type ProductType } from '@/types/backendDataTypes'
import { type CartItemType, type CartType } from '@/types/frontendDataTypes'
import React, { type ReactElement, useCallback, useMemo, useRef, useEffect } from 'react'

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
	const prevCartLengthRef = useRef<number>(0)

	// Helper function to map cart entries to CartItemType
	const mapCartEntries = useCallback((
		entries: Record<string, number>,
		items: ProductType[] | OptionType[],
		type: 'products' | 'options'
	): CartItemType[] => {
		return Object.entries(entries).reduce<CartItemType[]>((acc, [id, quantity]) => {
			const item = items.find(i => i._id === id)
			if (item !== undefined) {
				acc.push({
					id: item._id,
					name: item.name,
					price: item.price,
					type,
					quantity,
					imageURL: item.imageURL
				})
			}
			return acc
		}, [])
	}, [])

	// Memoize cart items to prevent unnecessary recalculations
	const cartItems: CartItemType[] = useMemo(() => {
		return [
			...mapCartEntries(cart.products, products, 'products'),
			...mapCartEntries(cart.options, options, 'options')
		]
	}, [mapCartEntries, cart, products, options])

	// Handle scrolling to the end of the cart when items are added
	useEffect(() => {
		if (cartItems.length > prevCartLengthRef.current) {
			endOfCartRef.current?.scrollIntoView({ behavior: 'smooth' })
		}
		prevCartLengthRef.current = cartItems.length
	}, [cartItems.length])

	return (
		<div className="pt-2">
			{cartItems.map(item => (
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
			))}
			<div ref={endOfCartRef} />
		</div>
	)
}

export default OrderSummary
