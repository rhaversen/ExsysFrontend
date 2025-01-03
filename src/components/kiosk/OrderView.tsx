import CartWindow from '@/components/kiosk/cart/CartWindow'
import SelectPaymentWindow from '@/components/kiosk/SelectPaymentWindow'
import OrderConfirmationWindow from '@/components/kiosk/confirmation/OrderConfirmationWindow'
import SelectionWindow from '@/components/kiosk/select/SelectionWindow'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import {
	type ActivityType,
	type KioskType,
	type OptionType,
	type OrderType,
	type PostOrderType,
	type ProductType
} from '@/types/backendDataTypes'
import { type OrderStatus, type CartType, type CheckoutMethod } from '@/types/frontendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

const OrderView = ({
	kiosk,
	products,
	options,
	activity,
	checkoutMethods,
	onClose
}: {
	kiosk: KioskType
	products: ProductType[]
	options: OptionType[]
	activity: ActivityType
	checkoutMethods: { sumUp: boolean, later: boolean, mobilePay: boolean }
	onClose: () => void
}): ReactElement => {
	const { addError } = useError()
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL

	const [isOrderConfirmationVisible, setIsOrderConfirmationVisible] = useState(false)
	const [orderStatus, setOrderStatus] = useState<OrderStatus>('loading')
	const [isSelectPaymentWindowVisible, setIsSelectPaymentWindowVisible] = useState(false)
	const [cart, setCart] = useState<CartType>({
		products: {},
		options: {}
	})
	const [order, setOrder] = useState<OrderType | null>(null)
	const [checkoutMethod, setCheckoutMethod] = useState<CheckoutMethod | null>(null)

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
			const currentQuantity = prevCart[type][_id] ?? 0
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

	// Synchronize cart with available products and options
	useEffect(() => {
		setCart((prevCart) => {
			const availableProductIds = new Set(products.map(p => p._id))
			const availableOptionIds = new Set(options.map(o => o._id))

			let updated = false
			let newProducts = { ...prevCart.products }
			let newOptions = { ...prevCart.options }

			// Check products
			Object.keys(newProducts).forEach(id => {
				if (!availableProductIds.has(id)) {
					const { [id]: _, ...rest } = newProducts
					newProducts = rest
					updated = true
				}
			})

			// Check options
			Object.keys(newOptions).forEach(id => {
				if (!availableOptionIds.has(id)) {
					const { [id]: _, ...rest } = newOptions
					newOptions = rest
					updated = true
				}
			})

			if (updated) {
				return {
					products: newProducts,
					options: newOptions
				}
			}

			return prevCart
		})
	}, [products, options])

	useEffect(() => {
		if (socket !== null && order !== null) {
			// Listen for payment status updates related to the order
			const handlePaymentStatusUpdated = (update: {
				orderId: string
				paymentStatus: 'successful' | 'failed' | 'pending'
			}): void => {
				if (update.orderId === order._id) {
					switch (update.paymentStatus) {
						case 'successful':
							setOrderStatus('success')
							break
						case 'failed':
							setOrderStatus('paymentFailed')
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
	const submitOrder = useCallback((checkoutMethod: CheckoutMethod): void => {
		setOrderStatus('loading')
		setCheckoutMethod(checkoutMethod)
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
				if (checkoutMethod === 'later') {
					setOrderStatus('success')
				} else {
					setOrderStatus('awaitingPayment')
				}
			})
			.catch(error => {
				addError(error)
				setOrderStatus('error')
			})
	}, [cart, kiosk, activity, API_URL, addError])

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
		<main className="flex flex-row bg-zinc-100 h-full">
			{/* Left Column: Header + Selection Window */}
			<div className="w-full flex flex-col">
				{/* Header */}
				<header className="flex flex-row p-2 items-center justify-between shadow-b-md">
					<div className="flex-1" /> {/* Left spacer */}
					<h1 className="text-3xl font-bold text-center text-gray-800">
						{'Bestil Til ' + activity.name}
					</h1>
					<div className="flex-1 flex justify-end"> {/* Right container */}
						{kiosk.activities.length > 1 && (
							<button
								onClick={onClose}
								className="bg-blue-500 rounded-md mx-5 py-2 px-4"
								type="button"
							>
								{'Vælg Anden Aktivitet'}
							</button>
						)}
					</div>
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
					onSubmit={() => { setIsSelectPaymentWindowVisible(true) }}
					formIsValid={isFormValid}
				/>
			</div>

			{/* Order Confirmation Modal */}
			{isOrderConfirmationVisible && (
				<OrderConfirmationWindow
					price={totalPrice}
					orderStatus={orderStatus}
					checkoutMethod={checkoutMethod}
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
