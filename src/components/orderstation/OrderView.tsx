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
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
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

	const [isFormValid, setIsFormValid] = useState(false)
	const [isOrderConfirmationVisible, setIsOrderConfirmationVisible] = useState(false)
	const [orderStatus, setOrderStatus] = useState<'success' | 'error' | 'loading' | 'awaitingPayment'>('loading')
	const [totalPrice, setTotalPrice] = useState(0)
	const [isSelectPaymentWindowVisible, setIsSelectPaymentWindowVisible] = useState(false)
	const [cart, setCart] = useState<CartType>({
		products: {},
		options: {}
	})
	const [order, setOrder] = useState<OrderType | null>(null)
	const [shouldFetchPaymentStatus, setShouldFetchPaymentStatus] = useState(false)

	// Check if any product is selected
	useEffect(() => {
		const isProductSelected = Object.values(cart.products).some(quantity => quantity > 0)
		setIsFormValid(isProductSelected)
	}, [cart])

	// Calculate total price
	useEffect(() => {
		const calculatedPrice = (
			Object.entries(cart.products).reduce((acc, [_id, quantity]) => acc + (products.find(product => product._id === _id)?.price ?? 0) * quantity, 0) +
			Object.entries(cart.options).reduce((acc, [_id, quantity]) => acc + (options.find(option => option._id === _id)?.price ?? 0) * quantity, 0)
		)
		setTotalPrice(calculatedPrice)
	}, [cart, options, products])

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

	useInterval(() => {
		if (shouldFetchPaymentStatus) {
			axios.get(`${API_URL}/v1/orders/${order?._id}/paymentStatus`, { withCredentials: true })
				.then(res => {
					const paymentStatus = res.data.paymentStatus as 'pending' | 'successful' | 'failed'
					if (paymentStatus === 'successful') {
						setOrderStatus('success')
						setShouldFetchPaymentStatus(false)
					} else if (paymentStatus === 'failed') {
						setOrderStatus('error')
						setShouldFetchPaymentStatus(false)
					} else if (paymentStatus === 'pending') {
						setOrderStatus('awaitingPayment')
					}
				})
				.catch(error => {
					addError(error)
					setOrderStatus('error')
					setShouldFetchPaymentStatus(false)
				})
		}
	}, shouldFetchPaymentStatus ? 1000 : null)

	const submitOrder = useCallback((checkoutMethod: 'sumUp' | 'cash' | 'mobilePay'): void => {
		setOrderStatus('loading')
		setIsOrderConfirmationVisible(true)

		const productCart = Object.entries(cart.products).map(([item, quantity]) => ({
			id: item,
			quantity
		}))
		const optionCart = Object.entries(cart.options).map(([item, quantity]) => ({
			id: item,
			quantity
		}))

		const data: PostOrderType = {
			kioskId: kiosk._id,
			activityId: activity._id,
			products: productCart,
			options: optionCart,
			checkoutMethod
		}

		axios.post(`${API_URL}/v1/orders`, data, { withCredentials: true })
			.then(res => {
				setOrder(res.data as OrderType)
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

	const handleCheckout = useCallback(() => {
		const hasMultipleCheckoutMethods = Object.values(checkoutMethods).filter(Boolean).length > 1
		if (hasMultipleCheckoutMethods) {
			setIsSelectPaymentWindowVisible(true)
		} else {
			submitOrder('cash')
		}
	}, [checkoutMethods, submitOrder])

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
			<div className="w-[400px] shadow-l-md ">
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
