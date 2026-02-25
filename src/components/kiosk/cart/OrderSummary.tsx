import { type ReactElement, useEffect, useMemo, useRef } from 'react'

import Item from '@/components/kiosk/cart/Item'
import OptionRow from '@/components/kiosk/cart/OptionRow'
import { type OptionType, type ProductType } from '@/types/backendDataTypes'
import { type CartType } from '@/types/frontendDataTypes'

const OrderSummary = ({
	products,
	options,
	cart,
	onProductChange,
	onOptionChange
}: {
	products: ProductType[]
	options: OptionType[]
	cart: CartType
	onProductChange: (productId: ProductType['_id'], change: number) => void
	onOptionChange: (productId: ProductType['_id'], optionId: OptionType['_id'], change: number) => void
}): ReactElement => {
	const endOfCartRef = useRef<HTMLDivElement | null>(null)
	const prevCartLengthRef = useRef<number>(0)

	const cartProducts = useMemo(() => {
		return cart.productOrder
			.map(id => products.find(p => p._id === id))
			.filter((p): p is ProductType => p !== undefined && (cart.products[p._id] ?? 0) > 0)
	}, [products, cart.products, cart.productOrder])

	useEffect(() => {
		if (cartProducts.length > prevCartLengthRef.current) {
			endOfCartRef.current?.scrollIntoView({ behavior: 'smooth' })
		}
		prevCartLengthRef.current = cartProducts.length
	}, [cartProducts.length])

	return (
		<div className="divide-y divide-gray-100">
			{cartProducts.map(product => (
				<div key={product._id} className="py-1">
					<Item
						imageURL={product.imageURL}
						id={product._id}
						name={product.name}
						price={product.price}
						type="products"
						quantity={cart.products[product._id]}
						onQuantityChange={(change) => { onProductChange(product._id, change) }}
					/>
					{product.options.length > 0 && (
						<div className="ml-8">
							{product.options
								.map(optionId => options.find(o => o._id === optionId))
								.filter((o): o is OptionType => o !== undefined)
								.map(option => (
									<OptionRow
										key={option._id}
										option={option}
										quantity={cart.options[product._id]?.[option._id] ?? 0}
										onQuantityChange={(change) => { onOptionChange(product._id, option._id, change) }}
									/>
								))
							}
						</div>
					)}
				</div>
			))}
			<div ref={endOfCartRef} />
		</div>
	)
}

export default OrderSummary
