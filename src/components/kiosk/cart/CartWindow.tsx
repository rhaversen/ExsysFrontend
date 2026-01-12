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
	onCartChange,
	onSubmit,
	clearCart,
	formIsValid
}: {
	price: ProductType['price'] | OptionType['price']
	products: ProductType[]
	options: OptionType[]
	cart: CartType
	onCartChange: (_id: ProductType['_id'] | OptionType['_id'], type: 'products' | 'options', quantity: number) => void
	onSubmit: () => void
	clearCart: () => void
	formIsValid: boolean
}): ReactElement => {
	const cartIsEmpty = Object.values(cart.products).every(quantity => quantity === 0) && Object.values(cart.options).every(quantity => quantity === 0)

	return (
		<div className="h-full flex flex-col">
			<h2 className="text-2xl font-bold p-5 text-center text-gray-800">
				{'Din Bestilling'}
			</h2>
			{cartIsEmpty
				? <div className="h-full flex items-center justify-center">
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
				<div className="flex flex-col items-center">
					<button
						className="flex items-center gap-1 w-fit m-2 px-4 py-2 rounded-full border border-orange-600 text-orange-600 hover:bg-orange-500 hover:text-white"
						type="button"
						onClick={clearCart}
					>
						<AsyncImage
							className="w-5 h-5"
							src={KioskImages.resetCart.src}
							alt={KioskImages.resetCart.alt}
							width={5}
							height={5}
							quality={75}
							priority={false}
							draggable={false}
						/>
						{'Ryd kurven'}
					</button>
					<div className="flex justify-center p-5">
						<button
							type="submit"
							className={`font-bold text-xl py-6 px-12 rounded-xl text-white 
								shadow-[0_0_15px_rgba(0,0,0,0.2)] transform transition-all duration-150
								relative overflow-hidden
								${!formIsValid
			? 'bg-gray-400 cursor-not-allowed'
			: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:scale-102 hover:shadow-[0_0_25px_rgba(0,0,0,0.3)] active:scale-98 cursor-pointer before:absolute before:inset-0 before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:-translate-x-full before:animate-shimmer'}`}
							onClick={onSubmit}
							disabled={!formIsValid}
						>
							{price === 0
								? 'Send Bestilling'
								: `Tryk her for at betale ${price} kr`}
						</button>
					</div>
				</div>
			}
		</div>
	)
}

export default CartWindow
