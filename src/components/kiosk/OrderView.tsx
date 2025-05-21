import axios from 'axios'
import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

import CartWindow from '@/components/kiosk/cart/CartWindow'
import OrderConfirmationWindow from '@/components/kiosk/confirmation/OrderConfirmationWindow'
import SelectionWindow from '@/components/kiosk/select/SelectionWindow'
import SelectPaymentWindow from '@/components/kiosk/SelectPaymentWindow'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useEntitySocketListeners from '@/hooks/CudWebsocket'
import {
	type RoomType,
	type ActivityType,
	type KioskType,
	type OptionType,
	type OrderType,
	type PostOrderType,
	type ProductType,
	PaymentStatus
} from '@/types/backendDataTypes'
import { type CartType, type CheckoutMethod, type OrderStatus } from '@/types/frontendDataTypes'

const OrderView = ({
	kiosk,
	products,
	options,
	activity,
	room,
	checkoutMethods,
	cart,
	updateCart,
	onClose,
	clearInactivityTimeout
}: {
	kiosk: KioskType
	products: ProductType[]
	options: OptionType[]
	activity: ActivityType
	room: RoomType
	checkoutMethods: { sumUp: boolean, later: boolean, mobilePay: boolean }
	cart: CartType
	updateCart: (cart: CartType) => void
	onClose: () => void
	clearInactivityTimeout: () => void
}): ReactElement => {
	const { addError } = useError()
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL

	const [isOrderConfirmationVisible, setIsOrderConfirmationVisible] = useState(false)
	const [orderStatus, setOrderStatus] = useState<OrderStatus>('loading')
	const [isSelectPaymentWindowVisible, setIsSelectPaymentWindowVisible] = useState(false)
	const [currentOrder, setCurrentOrder] = useState<OrderType | null>(null)
	const [checkoutMethod, setCheckoutMethod] = useState<CheckoutMethod | null>(null)
	const [isCancelling, setIsCancelling] = useState(false)

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
		const currentQuantity = cart[type][_id] ?? 0
		const newQuantity = currentQuantity + change

		// If the new quantity is less than or equal to zero, remove the item
		if (newQuantity <= 0) {
			const newCart = { ...cart }
			const updatedItems = { ...newCart[type] }
			delete updatedItems[_id]
			newCart[type] = updatedItems
			updateCart(newCart)
			return
		}

		// Otherwise, update the quantity of the item
		updateCart({
			...cart,
			[type]: {
				...cart[type],
				[_id]: newQuantity
			}
		})
	}, [cart, updateCart])

	// Synchronize cart with available products and options
	useEffect(() => {
		const availableProductIds = new Set(products.map(p => p._id))
		const availableOptionIds = new Set(options.map(o => o._id))

		let updated = false
		const newProductsInCart = { ...cart.products }
		const newOptionsInCart = { ...cart.options }

		// Check products
		Object.keys(newProductsInCart).forEach(id => {
			if (!availableProductIds.has(id)) {
				delete newProductsInCart[id]
				updated = true
			}
		})

		// Check options
		Object.keys(newOptionsInCart).forEach(id => {
			if (!availableOptionIds.has(id)) {
				delete newOptionsInCart[id]
				updated = true
			}
		})

		if (updated) {
			updateCart({
				products: newProductsInCart,
				options: newOptionsInCart
			})
		}
	}, [products, options, cart, updateCart])

	// Handle Order Status Change
	const handleOrderStatusChange = useCallback((status: PaymentStatus) => {
		switch (status) {
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
	}, [addError])

	// Submit Order Handler
	const submitOrder = useCallback((checkoutMethod: CheckoutMethod): void => {
		clearInactivityTimeout()
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
			roomId: room._id,
			products: prepareCartItems(cart.products),
			options: prepareCartItems(cart.options),
			checkoutMethod
		}

		axios.post<OrderType>(`${API_URL}/v1/orders`, data, { withCredentials: true })
			.then(response => {
				console.log('Order posted:', response.data)
				setCurrentOrder(response.data)
				handleOrderStatusChange(response.data.paymentStatus)
				return null
			})
			.catch(error => {
				addError(error)
				setOrderStatus('error')
			})
	}, [clearInactivityTimeout, kiosk, activity, room, cart, API_URL, handleOrderStatusChange, addError])

	const cancelPayment = useCallback(() => {
		if (!currentOrder) { return }
		setIsCancelling(true)
		axios.post(`${API_URL}/v1/orders/${currentOrder._id}/cancel`, {}, { withCredentials: true })
			.finally(() => setIsCancelling(false))
			.catch(error => addError(error))
	}, [currentOrder, API_URL, addError])

	useEntitySocketListeners<OrderType>(
		socket,
		'order',
		o => {
			console.log('Order created:', o)
			if (currentOrder !== null && o._id === currentOrder._id) {
				handleOrderStatusChange(o.paymentStatus)
			}
		},
		o => {
			console.log('Order updated:', o)
			if (currentOrder !== null && o._id === currentOrder._id) {
				handleOrderStatusChange(o.paymentStatus)
			}
		},
		id => {
			if (currentOrder !== null && id === currentOrder._id) {
				setOrderStatus('error')
			}
		}
	)

	useEffect(() => {
		if (WS_URL === undefined || WS_URL === null || WS_URL === '') { return }
		// Initialize WebSocket connection
		const socketInstance = io(WS_URL)
		setSocket(socketInstance)

		return () => {
			// Cleanup WebSocket connection on component unmount
			socketInstance.disconnect()
		}
	}, [WS_URL])

	const handleOrderConfirmationClose = useCallback(() => {
		setIsOrderConfirmationVisible(false)
		if (orderStatus === 'success') {
			onClose()
		}
	}, [orderStatus, onClose])

	const handleCartSubmit = useCallback(() => {
		if (totalPrice === 0) {
			submitOrder('later')
		} else {
			setIsSelectPaymentWindowVisible(true)
		}
	}, [totalPrice, submitOrder])

	return (
		<main className="flex flex-row h-full">
			{/* Left Column: Selection Window */}
			<div className="w-full flex flex-col">
				{/* Selection Window */}
				<div className="flex-1 overflow-y-auto">
					<SelectionWindow
						cart={cart}
						products={products}
						options={options}
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
					onSubmit={handleCartSubmit}
					clearCart={() => {
						updateCart({ products: {}, options: {} })
						window.dispatchEvent(new Event('resetScroll'))
					}}
					formIsValid={isFormValid}
				/>
			</div>

			{/* Order Confirmation Modal */}
			{isOrderConfirmationVisible && (
				<OrderConfirmationWindow
					price={totalPrice}
					orderStatus={orderStatus}
					checkoutMethod={checkoutMethod}
					onClose={handleOrderConfirmationClose}
					onCancelPayment={cancelPayment}
					isCancelling={isCancelling}
				/>
			)}

			{/* Select Payment Modal */}
			{isSelectPaymentWindowVisible && (
				<SelectPaymentWindow
					checkoutMethods={checkoutMethods}
					sumUpDisabled={(totalPrice > 0 && totalPrice < 5)}
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
