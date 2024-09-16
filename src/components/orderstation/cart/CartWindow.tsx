import OrderSummary from '@/components/orderstation/cart/OrderSummary'
import SubmitButton from '@/components/ui/SubmitButton'
import { type OptionType, type ProductType } from '@/types/backendDataTypes'
import { type CartType } from '@/types/frontendDataTypes'
import React, { type ReactElement, useEffect, useState } from 'react'

const CartWindow = ({
	price,
	products,
	options,
	cart,
	onCartChange,
	onSubmit,
	formIsValid
}: {
	price: ProductType['price'] | OptionType['price']
	products: ProductType[]
	options: OptionType[]
	cart: CartType
	onCartChange: (_id: ProductType['_id'] | OptionType['_id'], type: 'products' | 'options', quantity: number) => void
	onSubmit: () => void
	formIsValid: boolean
}): ReactElement => {
	const [cartIsEmpty, setCartIsEmpty] = useState(false)

	useEffect(() => {
		const cartIsEmpty = Object.values(cart.products).every(quantity => quantity === 0) && Object.values(cart.options).every(quantity => quantity === 0)
		setCartIsEmpty(cartIsEmpty)
	}, [cart])

	return (
		<div className="h-full flex flex-col">
			<h2 className="text-2xl font-bold p-5 text-center text-gray-800">
				{'Din Bestilling'}
			</h2>
			{cartIsEmpty
				? <div className="h-screen flex items-center justify-center">
					<p className="text-center italic text-xl text-gray-500">
						{'Din kurv er tom'}
						<br />
						<br />
						{'Vælg produkter'}
					</p>
				</div>
				: <div className="overflow-y-auto flex-1">
					<OrderSummary
						products={products}
						options={options}
						cart={cart}
						onCartChange={onCartChange}
					/>
				</div>
			}
			{!cartIsEmpty &&
				<SubmitButton
					text={`Betal ${price} kr`}
					disabled={!formIsValid}
					onClick={onSubmit}
				/>
			}
		</div>
	)
}

export default CartWindow
