import { type ReactElement } from 'react'

import OrderSummary from '@/components/kiosk/cart/OrderSummary'
import AsyncImage from '@/components/ui/AsyncImage'
import { KioskImages } from '@/lib/images'
import { type OptionType, type ProductType } from '@/types/backendDataTypes'
import { type CartType } from '@/types/frontendDataTypes'

const CartWindow = ({
	price,
	products,
	options,
	cart,
	onProductChange,
	onOptionChange,
	onSubmit,
	clearCart,
	formIsValid
}: {
	price: ProductType['price'] | OptionType['price']
	products: ProductType[]
	options: OptionType[]
	cart: CartType
	onProductChange: (productId: ProductType['_id'], change: number) => void
	onOptionChange: (productId: ProductType['_id'], optionId: OptionType['_id'], change: number) => void
	onSubmit: () => void
	clearCart: () => void
	formIsValid: boolean
}): ReactElement => {
	const cartIsEmpty = Object.values(cart.products).every(quantity => quantity === 0) &&
		Object.values(cart.options).every(productOptions => Object.values(productOptions).every(quantity => quantity === 0))

	return (
		<div className="h-full flex flex-col min-w-0 overflow-hidden">
			{cartIsEmpty
				? <div className="h-full flex items-center justify-center">
					<p className="text-center italic text-lg text-gray-400">
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
						onProductChange={onProductChange}
						onOptionChange={onOptionChange}
					/>
				</div>
			}
			{!cartIsEmpty &&
				<div className="px-4 py-3 space-y-5">
					<button
						className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-sm text-orange-600 hover:bg-orange-50 cursor-pointer"
						type="button"
						onClick={clearCart}
					>
						<AsyncImage
							className="w-4 h-4"
							src={KioskImages.resetCart.src}
							alt={KioskImages.resetCart.alt}
							width={4}
							height={4}
							quality={75}
							priority={true}
							draggable={false}
						/>
						{'Ryd kurven'}
					</button>
					<button
						type="submit"
						className={`w-full font-bold text-lg py-4 rounded-xl text-white shadow-[0_0_15px_rgba(0,0,0,0.2)] transform transition-all duration-150 relative overflow-hidden ${!formIsValid ? 'bg-gray-400 cursor-not-allowed' : 'bg-linear-to-r from-blue-500 to-blue-600 hover:scale-102 hover:shadow-[0_0_25px_rgba(0,0,0,0.3)] active:scale-98 cursor-pointer before:absolute before:inset-0 before:w-full before:h-full before:bg-linear-to-r before:from-transparent before:via-white/10 before:to-transparent before:-translate-x-full before:animate-shimmer'}`}
						onClick={onSubmit}
						disabled={!formIsValid}
					>
						{price === 0
							? 'Send Bestilling'
							: `Tryk her for at betale ${price} kr`}
					</button>
				</div>
			}
		</div>
	)
}

export default CartWindow
