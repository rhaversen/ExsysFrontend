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
import React, { type ReactElement, useCallback, useMemo, useState, useEffect } from 'react'
import { io, type Socket } from 'socket.io-client'

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
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL

	const [isOrderConfirmationVisible, setIsOrderConfirmationVisible] = useState(false)
	const [orderStatus, setOrderStatus] = useState<'success' | 'error' | 'loading' | 'awaitingPayment'>('loading')
	const [isSelectPaymentWindowVisible, setIsSelectPaymentWindowVisible] = useState(false)
	const [cart, setCart] = useState<CartType>({
		products: {},
		options: {}
	})
	const [order, setOrder] = useState<OrderType | null>(null)

	// WebSocket Connection
	const [socket, setSocket] = useState<Socket | null>(null)

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
		setCart((prevCart) => {
			const currentQuantity = prevCart[type][_id] === 0 || isNaN(prevCart[type][_id]) ? 0 : prevCart[type][_id]
			const newQuantity = currentQuantity + change

			// If the new quantity is less than or equal to zero, remove the item
			if (newQuantity <= 0) {
				const { [_id]: _, ...updatedItems } = prevCart[type]
				return {
					...prevCart,
					[type]: updatedItems
				}
			}

			// Otherwise, update the quantity of the item
			return {
				...prevCart,
				[type]: {
					...prevCart[type],
					[_id]: newQuantity
				}
			}
		})
	}, [])

	useEffect(() => {
		if (socket !== null && order !== null) {
			// Listen for payment status updates related to the order
			const handlePaymentStatusUpdated = (update: { orderId: string, paymentStatus: 'successful' | 'failed' | 'pending' }): void => {
				if (update.orderId === order._id) {
					switch (update.paymentStatus) {
						case 'successful':
							setOrderStatus('success')
							break
						case 'failed':
							setOrderStatus('error')
							break
						case 'pending':
							setOrderStatus('awaitingPayment')
							break
						default:
							addError(new Error('Unknown payment status'))
							setOrderStatus('error')
							break
					}
				}
			}

			socket.on('paymentStatusUpdated', handlePaymentStatusUpdated)

			// Cleanup the listener when order or socket changes
			return () => {
				socket.off('paymentStatusUpdated', handlePaymentStatusUpdated)
			}
		}
	}, [socket, order, addError])

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
				setOrderStatus('awaitingPayment')
			})
			.catch(error => {
				addError(error)
				setOrderStatus('error')
			})
	}, [cart, kiosk, activity, API_URL, addError])

	// Handle Checkout based on available methods
	const handleCheckout = useCallback(() => {
		const availableMethods = Object.entries(checkoutMethods)
			.filter(([_, enabled]) => enabled)
			.map(([method, _]) => method)

		if (availableMethods.length > 1) {
			setIsSelectPaymentWindowVisible(true)
		} else if (availableMethods.length === 1) {
			submitOrder(availableMethods[0] as 'sumUp' | 'cash' | 'mobilePay')
		} else {
			addError(new Error('No checkout methods available'))
		}
	}, [checkoutMethods, submitOrder, addError])

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
		setOrder(null)
	}, [kiosk, onClose])

	useEffect(() => {
		if (WS_URL === undefined || WS_URL === null || WS_URL === '') return
		// Initialize WebSocket connection
		const socketInstance = io(WS_URL)
		setSocket(socketInstance)

		return () => {
			// Cleanup WebSocket connection on component unmount
			socketInstance.disconnect()
		}
	}, [WS_URL])

	return (
		<main className="flex flex-row h-screen bg-zinc-100">
			{/* Left Column: Header + Selection Window */}
			<div className="w-full flex flex-col bg-red-500">
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
