import React from 'react'
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
	return (
		<div>
			<OrderSummary
				products={products}
				options={options}
				cart={cart}
				onCartChange={onCartChange}
			/>
			<div className="h-2 text-black">
				{`Samlet Pris: ${(
					Object.entries(cart.products).reduce((acc, [_id, quantity]) => acc + products.find(product => product._id === _id)?.price! * quantity, 0) +
					Object.entries(cart.options).reduce((acc, [_id, quantity]) => acc + options.find(option => option._id === _id)?.price! * quantity, 0)
				)} kr`}
			</div>
			<SubmitButton
				disabled={!formIsValid}
				onClick={onSubmit}
			/>
		</div>
	)
}

export default CartWindow