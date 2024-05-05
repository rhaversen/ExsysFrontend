import React, { useEffect, useState } from 'react'
import { ProductType, OptionType } from '@/app/orderstation/[room]/page'
import { CartType } from '@/app/orderstation/[room]/page'
import OrderSummary from '@/components/orderstation/cart/OrderSummary'
import SubmitButton from '@/components/ui/SubmitButton'

const CartWindow = ({
	products,
	options,
	cart,
	onCartChange,
	onSubmit,
	formIsValid
}: {
	products: ProductType[]
	options: OptionType[]
	cart: CartType
	onCartChange: (_id: string, type: 'products' | 'options', quantity: number) => void
	onSubmit: () => void
	formIsValid: boolean
}) => {
	const [cartIsEmpty, setCartIsEmpty] = useState(false)

	useEffect(() => {
		const cartIsEmpty = Object.values(cart.products).every(quantity => quantity === 0) && Object.values(cart.options).every(quantity => quantity === 0)
		setCartIsEmpty(cartIsEmpty)
	}, [cart])

	return (
		<div className='bg-gray-300 h-full flex flex-col'>
			{cartIsEmpty ?
				<div className="h-screen flex items-center justify-center">
					<p className="text-center italic text-xl text-gray-500">
						{'Din kurv er tom'}
						{'Vælg produkter på vinduet til venstre'}
					</p>
				</div>
				: <div className="overflow-y-auto flex-1 shadow-inner">
					<OrderSummary
						products={products}
						options={options}
						cart={cart}
						onCartChange={onCartChange}
					/>
				</div>
			}
			<div className="h-2 text-black">
				{`Samlet Pris: ${(
					Object.entries(cart.products).reduce((acc, [_id, quantity]) => acc + products.find(product => product._id === _id)?.price! * quantity, 0) +
					Object.entries(cart.options).reduce((acc, [_id, quantity]) => acc + options.find(option => option._id === _id)?.price! * quantity, 0)
				)} kr`}
			</div>
			<SubmitButton
				text='Bestil'
				disabled={!formIsValid}
				onClick={onSubmit}
			/>
		</div>
	)
}

export default CartWindow