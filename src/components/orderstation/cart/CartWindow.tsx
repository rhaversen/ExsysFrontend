import React from 'react'
import { ProductType, OptionType } from '@/app/orderstation/[room]/page'
import { CartType } from '@/app/orderstation/[room]/page'

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
		</div>
	)
}

export default CartWindow