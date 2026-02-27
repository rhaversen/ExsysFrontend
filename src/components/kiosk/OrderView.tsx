import axios from 'axios'
import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'

import CartWindow from '@/components/kiosk/cart/CartWindow'
import OrderConfirmationWindow from '@/components/kiosk/confirmation/OrderConfirmationWindow'
import SelectionWindow from '@/components/kiosk/select/SelectionWindow'
import SelectPaymentWindow from '@/components/kiosk/SelectPaymentWindow'
import { useAnalytics } from '@/contexts/AnalyticsProvider'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useEntitySocket } from '@/hooks/CudWebsocket'
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

interface OrderViewProps {
	kiosk: KioskType
	products: ProductType[]
	options: OptionType[]
	activity: ActivityType
	room: RoomType
	checkoutMethods: { sumUp: boolean, later: boolean, mobilePay: boolean }
	cart: CartType
	updateCart: (cart: CartType) => void
	onClose: () => void
	onOrderStart: () => void
}

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
	onOrderStart
}: OrderViewProps): ReactElement => {
	const { addError } = useError()
	const { track } = useAnalytics()
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [isOrderConfirmationVisible, setIsOrderConfirmationVisible] = useState(false)
	const [orderStatus, setOrderStatus] = useState<OrderStatus>('loading')
	const [isSelectPaymentWindowVisible, setIsSelectPaymentWindowVisible] = useState(false)
	const [currentOrder, setCurrentOrder] = useState<OrderType | null>(null)
	const [checkoutMethod, setCheckoutMethod] = useState<CheckoutMethod | null>(null)
	const [isCancelling, setIsCancelling] = useState(false)

	const isFormValid = useMemo(() => {
		return Object.values(cart.products).some(quantity => quantity > 0)
	}, [cart])

	const totalPrice = useMemo(() => {
		const productsTotal = Object.entries(cart.products).reduce((acc, [_id, quantity]) => {
			const product = products.find(p => p._id === _id)
			return acc + (product?.price ?? 0) * quantity
		}, 0)

		const optionsTotal = Object.values(cart.options).reduce((acc, productOptions) => {
			return acc + Object.entries(productOptions).reduce((innerAcc, [optionId, quantity]) => {
				const option = options.find(o => o._id === optionId)
				return innerAcc + (option?.price ?? 0) * quantity
			}, 0)
		}, 0)

		return productsTotal + optionsTotal
	}, [cart, products, options])

	const handleProductChange = useCallback((productId: ProductType['_id'], change: number): void => {
		const currentQuantity = cart.products[productId] ?? 0
		const newQuantity = currentQuantity + change

		if (newQuantity <= 0) {
			const newProducts = { ...cart.products }
			delete newProducts[productId]
			const newOptions = { ...cart.options }
			delete newOptions[productId]
			updateCart({
				products: newProducts,
				options: newOptions,
				productOrder: cart.productOrder.filter(id => id !== productId)
			})
			return
		}

		const isNew = currentQuantity === 0
		updateCart({
			products: { ...cart.products, [productId]: newQuantity },
			options: { ...cart.options, [productId]: cart.options[productId] ?? {} },
			productOrder: isNew ? [...cart.productOrder, productId] : cart.productOrder
		})
	}, [cart, updateCart])

	const handleOptionChange = useCallback((productId: ProductType['_id'], optionId: OptionType['_id'], change: number): void => {
		const productOptions = cart.options[productId] ?? {}
		const currentQuantity = productOptions[optionId] ?? 0
		const newQuantity = currentQuantity + change

		if (newQuantity <= 0) {
			const updatedProductOptions = { ...productOptions }
			delete updatedProductOptions[optionId]
			updateCart({
				...cart,
				options: { ...cart.options, [productId]: updatedProductOptions }
			})
			return
		}

		updateCart({
			...cart,
			options: {
				...cart.options,
				[productId]: { ...productOptions, [optionId]: newQuantity }
			}
		})
	}, [cart, updateCart])

	useEffect(() => {
		const availableProductIds = new Set(products.map(p => p._id))
		const availableOptionIds = new Set(options.map(o => o._id))

		let updated = false
		const newProducts = { ...cart.products }
		const newOptions = { ...cart.options }

		Object.keys(newProducts).forEach(id => {
			if (!availableProductIds.has(id)) {
				delete newProducts[id]
				delete newOptions[id]
				updated = true
			}
		})

		Object.entries(newOptions).forEach(([productId, productOptions]) => {
			const cleaned = { ...productOptions }
			Object.keys(cleaned).forEach(optionId => {
				if (!availableOptionIds.has(optionId)) {
					delete cleaned[optionId]
					updated = true
				}
			})
			newOptions[productId] = cleaned
		})

		if (updated) {
			updateCart({
				products: newProducts,
				options: newOptions,
				productOrder: cart.productOrder.filter(id => availableProductIds.has(id) && newProducts[id] !== undefined)
			})
		}
	}, [products, options, cart, updateCart])

	const mapPaymentStatusToOrderStatus = useCallback((status: PaymentStatus, orderId?: string): OrderStatus => {
		switch (status) {
			case 'successful':
				track('checkout_complete', { orderId })
				return 'success'
			case 'failed':
				track('checkout_failed', { orderId })
				return 'paymentFailed'
			case 'pending':
				return 'awaitingPayment'
			default:
				track('checkout_failed', { orderId })
				addError(new Error('Unknown payment status'))
				return 'error'
		}
	}, [addError, track])

	const submitOrder = useCallback((selectedCheckoutMethod: CheckoutMethod): void => {
		onOrderStart()
		setOrderStatus('loading')
		setCheckoutMethod(selectedCheckoutMethod)
		setIsOrderConfirmationVisible(true)

		const prepareCartItems = (items: Record<string, number>): Array<{ id: string, quantity: number }> =>
			Object.entries(items).map(([id, quantity]) => ({ id, quantity }))

		const flattenedOptions: Record<string, number> = {}
		Object.values(cart.options).forEach(productOptions => {
			Object.entries(productOptions).forEach(([optionId, quantity]) => {
				flattenedOptions[optionId] = (flattenedOptions[optionId] ?? 0) + quantity
			})
		})

		const data: PostOrderType = {
			kioskId: kiosk._id,
			activityId: activity._id,
			roomId: room._id,
			products: prepareCartItems(cart.products),
			options: prepareCartItems(flattenedOptions),
			checkoutMethod: selectedCheckoutMethod
		}

		axios.post<OrderType>(`${API_URL}/v1/orders`, data, { withCredentials: true })
			.then(response => {
				setCurrentOrder(response.data)
				setOrderStatus(mapPaymentStatusToOrderStatus(response.data.paymentStatus, response.data._id))
				return null
			})
			.catch(error => {
				track('checkout_failed', { orderId: undefined })
				addError(error)
				setOrderStatus('error')
			})
	}, [onOrderStart, kiosk, activity, room, cart, API_URL, mapPaymentStatusToOrderStatus, addError, track])

	const cancelPayment = useCallback(() => {
		if (!currentOrder) { return }
		setIsCancelling(true)

		axios.post(`${API_URL}/v1/orders/${currentOrder._id}/cancel`, {}, { withCredentials: true })
			.catch(error => addError(error))
	}, [currentOrder, API_URL, addError])

	useEntitySocket<OrderType>('order', {
		onCreate: order => {
			if (currentOrder?._id === order._id) {
				setOrderStatus(mapPaymentStatusToOrderStatus(order.paymentStatus, order._id))
			}
		},
		onUpdate: order => {
			if (currentOrder?._id === order._id) {
				setOrderStatus(mapPaymentStatusToOrderStatus(order.paymentStatus, order._id))
			}
		},
		onDelete: id => {
			if (currentOrder?._id === id) {
				track('checkout_failed', { orderId: id })
				setOrderStatus('error')
			}
		}
	})

	// Auto-cancel and reset after 5 minutes of waiting for payment
	useEffect(() => {
		if (orderStatus !== 'awaitingPayment' || !currentOrder) {
			return
		}

		const timeoutId = setTimeout(() => {
			// Cancel the payment
			axios.post(`${API_URL}/v1/orders/${currentOrder._id}/cancel`, {}, { withCredentials: true })
				.catch(error => addError(error))

			// Reset the entire state
			setIsOrderConfirmationVisible(false)
			onClose()
		}, 5 * 60 * 1000) // 5 minutes

		return () => { clearTimeout(timeoutId) }
	}, [orderStatus, currentOrder, API_URL, addError, track, onClose])

	const handleOrderConfirmationClose = useCallback(() => {
		setIsOrderConfirmationVisible(false)
		onClose()
	}, [onClose])

	const handleCartSubmit = useCallback(() => {
		track('checkout_start')
		if (totalPrice === 0) {
			track('payment_auto_later')
			submitOrder('later')
		} else {
			setIsSelectPaymentWindowVisible(true)
		}
	}, [totalPrice, submitOrder, track])

	const clearCart = useCallback(() => {
		track('cart_clear')
		updateCart({ products: {}, options: {}, productOrder: [] })
		window.dispatchEvent(new Event('resetScroll'))
	}, [updateCart, track])

	return (
		<main className="flex flex-row h-full">
			<div className="w-full flex flex-col">
				<div className="flex-1 overflow-y-auto">
					<SelectionWindow
						cart={cart}
						products={products}
						onProductChange={handleProductChange}
					/>
				</div>
			</div>

			<div className="w-75 shrink-0 shadow-l-md">
				<CartWindow
					price={totalPrice}
					products={products}
					options={options}
					cart={cart}
					onProductChange={handleProductChange}
					onOptionChange={handleOptionChange}
					onSubmit={handleCartSubmit}
					clearCart={clearCart}
					formIsValid={isFormValid}
				/>
			</div>

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

			{isSelectPaymentWindowVisible && (
				<SelectPaymentWindow
					checkoutMethods={checkoutMethods}
					sumUpDisabled={totalPrice > 0 && totalPrice < 5}
					onCancel={() => setIsSelectPaymentWindowVisible(false)}
					onSubmit={selectedMethod => {
						submitOrder(selectedMethod)
						setIsSelectPaymentWindowVisible(false)
					}}
				/>
			)}
		</main>
	)
}

export default OrderView
