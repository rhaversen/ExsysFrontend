import axios from 'axios'
import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'

import CartWindow from '@/components/kiosk/cart/CartWindow'
import OrderConfirmationWindow from '@/components/kiosk/confirmation/OrderConfirmationWindow'
import SelectionWindow from '@/components/kiosk/select/SelectionWindow'
import SelectPaymentWindow from '@/components/kiosk/SelectPaymentWindow'
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
	onOrderEnd: () => void
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
	onOrderStart,
	onOrderEnd
}: OrderViewProps): ReactElement => {
	const { addError } = useError()
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

		const optionsTotal = Object.entries(cart.options).reduce((acc, [_id, quantity]) => {
			const option = options.find(o => o._id === _id)
			return acc + (option?.price ?? 0) * quantity
		}, 0)

		return productsTotal + optionsTotal
	}, [cart, products, options])

	const handleCartChange = useCallback((
		_id: ProductType['_id'] | OptionType['_id'],
		type: 'products' | 'options',
		change: number
	): void => {
		const currentQuantity = cart[type][_id] ?? 0
		const newQuantity = currentQuantity + change

		if (newQuantity <= 0) {
			const updatedItems = { ...cart[type] }
			delete updatedItems[_id]
			updateCart({ ...cart, [type]: updatedItems })
			return
		}

		updateCart({
			...cart,
			[type]: { ...cart[type], [_id]: newQuantity }
		})
	}, [cart, updateCart])

	useEffect(() => {
		const availableProductIds = new Set(products.map(p => p._id))
		const availableOptionIds = new Set(options.map(o => o._id))

		let updated = false
		const newProductsInCart = { ...cart.products }
		const newOptionsInCart = { ...cart.options }

		Object.keys(newProductsInCart).forEach(id => {
			if (!availableProductIds.has(id)) {
				delete newProductsInCart[id]
				updated = true
			}
		})

		Object.keys(newOptionsInCart).forEach(id => {
			if (!availableOptionIds.has(id)) {
				delete newOptionsInCart[id]
				updated = true
			}
		})

		if (updated) {
			updateCart({ products: newProductsInCart, options: newOptionsInCart })
		}
	}, [products, options, cart, updateCart])

	const mapPaymentStatusToOrderStatus = useCallback((status: PaymentStatus): OrderStatus => {
		switch (status) {
			case 'successful':
				return 'success'
			case 'failed':
				return 'paymentFailed'
			case 'pending':
				return 'awaitingPayment'
			default:
				addError(new Error('Unknown payment status'))
				return 'error'
		}
	}, [addError])

	const submitOrder = useCallback((selectedCheckoutMethod: CheckoutMethod): void => {
		onOrderStart()
		setOrderStatus('loading')
		setCheckoutMethod(selectedCheckoutMethod)
		setIsOrderConfirmationVisible(true)

		const prepareCartItems = (items: Record<string, number>): Array<{ id: string, quantity: number }> =>
			Object.entries(items).map(([id, quantity]) => ({ id, quantity }))

		const data: PostOrderType = {
			kioskId: kiosk._id,
			activityId: activity._id,
			roomId: room._id,
			products: prepareCartItems(cart.products),
			options: prepareCartItems(cart.options),
			checkoutMethod: selectedCheckoutMethod
		}

		axios.post<OrderType>(`${API_URL}/v1/orders`, data, { withCredentials: true })
			.then(response => {
				setCurrentOrder(response.data)
				setOrderStatus(mapPaymentStatusToOrderStatus(response.data.paymentStatus))
				return null
			})
			.catch(error => {
				addError(error)
				setOrderStatus('error')
			})
	}, [onOrderStart, kiosk, activity, room, cart, API_URL, mapPaymentStatusToOrderStatus, addError])

	const cancelPayment = useCallback(() => {
		if (!currentOrder) { return }
		setIsCancelling(true)
		axios.post(`${API_URL}/v1/orders/${currentOrder._id}/cancel`, {}, { withCredentials: true })
			.finally(() => setIsCancelling(false))
			.catch(error => addError(error))
	}, [currentOrder, API_URL, addError])

	useEntitySocket<OrderType>('order', {
		onCreate: order => {
			if (currentOrder?._id === order._id) {
				setOrderStatus(mapPaymentStatusToOrderStatus(order.paymentStatus))
			}
		},
		onUpdate: order => {
			if (currentOrder?._id === order._id) {
				setOrderStatus(mapPaymentStatusToOrderStatus(order.paymentStatus))
			}
		},
		onDelete: id => {
			if (currentOrder?._id === id) {
				setOrderStatus('error')
			}
		}
	})

	const handleOrderConfirmationClose = useCallback(() => {
		setIsOrderConfirmationVisible(false)
		if (orderStatus === 'success') {
			onClose()
		} else {
			onOrderEnd()
		}
	}, [orderStatus, onClose, onOrderEnd])

	const handleCartSubmit = useCallback(() => {
		if (totalPrice === 0) {
			submitOrder('later')
		} else {
			setIsSelectPaymentWindowVisible(true)
		}
	}, [totalPrice, submitOrder])

	const clearCart = useCallback(() => {
		updateCart({ products: {}, options: {} })
		window.dispatchEvent(new Event('resetScroll'))
	}, [updateCart])

	return (
		<main className="flex flex-row h-full">
			<div className="w-full flex flex-col">
				<div className="flex-1 overflow-y-auto">
					<SelectionWindow
						cart={cart}
						products={products}
						options={options}
						handleCartChange={handleCartChange}
					/>
				</div>
			</div>

			<div className="w-[400px] shadow-l-md">
				<CartWindow
					price={totalPrice}
					products={products}
					options={options}
					cart={cart}
					onCartChange={handleCartChange}
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
