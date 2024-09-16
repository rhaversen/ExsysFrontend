import CartWindow from '@/components/orderstation/cart/CartWindow'
import SelectPaymentWindow from '@/components/orderstation/cart/SelectPaymentWindow'
import OrderConfirmationWindow from '@/components/orderstation/confirmation/OrderConfirmationWindow'
import SelectionWindow from '@/components/orderstation/select/SelectionWindow'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import {
	type ActivityType,
	type KioskTypeNonPopulated,
	type OptionType,
	type OrderType,
	type PostOrderType,
	type ProductType
} from '@/types/backendDataTypes'
import { type CartType } from '@/types/frontendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useMemo, useState } from 'react'
import { useInterval } from 'react-use'

const OrderView = ({
	kiosk,
	products,
	options,
	activity,
	checkoutMethods,
	onClose
}: {
	kiosk: KioskTypeNonPopulated
	products: ProductType[]
	options: OptionType[]
	activity: ActivityType
	checkoutMethods: { sumUp: boolean, cash: boolean, mobilePay: boolean }
	onClose: () => void
}): ReactElement => {
	const { addError } = useError()
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	// State Management
	const [isOrderConfirmationVisible, setIsOrderConfirmationVisible] = useState(false)
	const [orderStatus, setOrderStatus] = useState<'success' | 'error' | 'loading' | 'awaitingPayment'>('loading')
	const [isSelectPaymentWindowVisible, setIsSelectPaymentWindowVisible] = useState(false)
	const [cart, setCart] = useState<CartType>({
		products: {},
		options: {}
	})
	const [order, setOrder] = useState<OrderType | null>(null)
	const [shouldFetchPaymentStatus, setShouldFetchPaymentStatus] = useState(false)

	// Derived States using useMemo
	const isFormValid = useMemo(() => {
		return Object.values(cart.products).some(quantity => quantity > 0)
	}, [cart])

	const totalPrice = useMemo(() => {
		const productsTotal = Object.entries(cart.products).reduce((acc, [_id, quantity]) => {
			const product = products.find(p => p._id === _id)
			return acc + (product?.price ?? 0) * quantity
		}, 0)

		const optionsTotal = Object.entries(cart.options).reduce((acc, [_id, quantity]) => {
			const option = options.find(o => o._id === _id)
			return acc + (option?.price ?? 0) * quantity
		}, 0)

		return productsTotal + optionsTotal
	}, [cart, products, options])

	// Handler to change cart items using functional updates
	const handleCartChange = useCallback((_id: ProductType['_id'] | OptionType['_id'], type: 'products' | 'options', change: number): void => {
		// Copy the cart object
		const newCart = { ...cart }
		// If the item is not in the cart, add it with a quantity of 0
		if (newCart[type][_id] === undefined) newCart[type][_id] = 0
		// Change the quantity of the item
		newCart[type][_id] += change
		// If the quantity is 0 or less, remove the item from the cart
		if (newCart[type][_id] <= 0) {
			newCart[type] = Object.entries(newCart[type]).reduce<CartType[typeof type]>((acc, [key, value]) => {
				// If the item is not the one to remove, add it to the accumulator
				if (key !== _id) acc[key] = value
				return acc
			}, {})
		}
		setCart(newCart)
	}, [cart])

	// Polling Payment Status
	useInterval(() => {
		if (shouldFetchPaymentStatus && order !== null) {
			axios.get(`${API_URL}/v1/orders/${order._id}/paymentStatus`, { withCredentials: true })
				.then(response => {
					const paymentStatus = response.data.paymentStatus as 'pending' | 'successful' | 'failed'

					switch (paymentStatus) {
						case 'successful':
							setOrderStatus('success')
							setShouldFetchPaymentStatus(false)
							break
						case 'failed':
							setOrderStatus('error')
							setShouldFetchPaymentStatus(false)
							break
						case 'pending':
							setOrderStatus('awaitingPayment')
							break
						default:
							throw new Error('Unknown payment status')
					}
				})
				.catch(error => {
					addError(error)
					setOrderStatus('error')
					setShouldFetchPaymentStatus(false)
				})
		}
	}, shouldFetchPaymentStatus ? 1000 : null)

	// Submit Order Handler
	const submitOrder = useCallback((checkoutMethod: 'sumUp' | 'cash' | 'mobilePay'): void => {
		setOrderStatus('loading')
		setIsOrderConfirmationVisible(true)

		const prepareCartItems = (items: Record<string, number>): Array<{ id: string, quantity: number }> =>
			Object.entries(items).map(([id, quantity]) => ({
				id,
				quantity
			}))

		const data: PostOrderType = {
			kioskId: kiosk._id,
			activityId: activity._id,
			products: prepareCartItems(cart.products),
			options: prepareCartItems(cart.options),
			checkoutMethod
		}

		axios.post<OrderType>(`${API_URL}/v1/orders`, data, { withCredentials: true })
			.then(response => {
				setOrder(response.data)
				if (checkoutMethod === 'sumUp') {
					setShouldFetchPaymentStatus(true)
				} else {
					setOrderStatus('success')
				}
			})
			.catch(error => {
				addError(error)
				setOrderStatus('error')
				setShouldFetchPaymentStatus(false)
			})
	}, [cart, kiosk, activity, API_URL, addError])

	// Handle Checkout based on available methods
	const handleCheckout = useCallback(() => {
		const availableMethods = Object.values(checkoutMethods).filter(Boolean)
		if (availableMethods.length > 1) {
			setIsSelectPaymentWindowVisible(true)
		} else {
			submitOrder('cash')
		}
	}, [checkoutMethods, submitOrder])

	// Reset Function to clear cart and states
	const reset = useCallback((): void => {
		if (kiosk.activities.length > 1) {
			onClose()
		}
		setCart({
			products: {},
			options: {}
		})
		setIsOrderConfirmationVisible(false)
		setOrderStatus('loading')
	}, [kiosk, onClose])

	return (
		<main className="flex flex-row h-screen bg-zinc-100">
			{/* Left Column: Header + Selection Window */}
			<div className="w-full flex flex-col">
				{/* Header */}
				<header className="flex flex-row p-5 items-center justify-center shadow-b-md">
					<h1 className="text-3xl font-bold text-center py-2 text-gray-800">
						{'Bestil til ' + activity.name}
					</h1>
					{kiosk.activities.length > 1 && (
						<button
							onClick={onClose}
							className="bg-blue-500 rounded-md mx-5 py-2 px-4"
							type="button"
						>
							{'Skift Aktivitet'}
						</button>
					)}
				</header>

				{/* Selection Window */}
				<div className="flex-1 overflow-y-auto">
					<SelectionWindow
						cart={cart}
						products={products}
						handleCartChange={handleCartChange}
					/>
				</div>
			</div>

			{/* Cart Window */}
			<div className="w-[400px] shadow-l-md">
				<CartWindow
					price={totalPrice}
					products={products}
					options={options}
					cart={cart}
					onCartChange={handleCartChange}
					onSubmit={handleCheckout}
					formIsValid={isFormValid}
				/>
			</div>

			{/* Order Confirmation Modal */}
			{isOrderConfirmationVisible && (
				<OrderConfirmationWindow
					price={totalPrice}
					orderStatus={orderStatus}
					onClose={reset}
				/>
			)}

			{/* Select Payment Modal */}
			{isSelectPaymentWindowVisible && (
				<SelectPaymentWindow
					checkoutMethods={checkoutMethods}
					onCancel={() => { setIsSelectPaymentWindowVisible(false) }}
					onSubmit={checkoutMethod => {
						submitOrder(checkoutMethod)
						setIsOrderConfirmationVisible(true)
						setIsSelectPaymentWindowVisible(false)
					}}
				/>
			)}
		</main>
	)
}

export default OrderView
