'use client'

import CartWindow from '@/components/orderstation/cart/CartWindow'
import SelectPaymentWindow from '@/components/orderstation/cart/SelectPaymentWindow'
import OrderConfirmationWindow from '@/components/orderstation/confirmation/OrderConfirmationWindow'
import SelectionWindow from '@/components/orderstation/select/SelectionWindow'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { convertOrderWindowFromUTC } from '@/lib/timeUtils'
import { type KioskTypeNonPopulated, type ActivityType, type OptionType, type ProductType, type OrderType } from '@/types/backendDataTypes'
import { type CartType } from '@/types/frontendDataTypes'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import { useInterval } from 'react-use'

export default function Page ({ params }: Readonly<{ params: { activity: ActivityType['_id'] } }>): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const router = useRouter()
	const { addError } = useError()

	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [cart, setCart] = useState<CartType>({ products: {}, options: {} })
	const [isFormValid, setIsFormValid] = useState(false)
	const [isOrderConfirmationVisible, setIsOrderConfirmationVisible] = useState(false)
	const [orderStatus, setOrderStatus] = useState<'success' | 'error' | 'loading' | 'awaitingPayment'>('loading')
	const [totalPrice, setTotalPrice] = useState(0)
	const [activityName, setActivityName] = useState('')
	const [activityCount, setActivityCount] = useState(0)
	const [kioskId, setKioskId] = useState('')
	const [isSelectPaymentWindowVisible, setIsSelectPaymentWindowVisible] = useState(false)
	const [order, setOrder] = useState<OrderType | null>(null)
	const [shouldFetchPaymentStatus, setShouldFetchPaymentStatus] = useState(false)
	const [hasReader, setHasReader] = useState(false)

	const fetchActivityCount = useCallback(async () => {
		const [kioskResponse, activitiesResponse] = await Promise.all([
			axios.get(`${API_URL}/v1/kiosks/me`, { withCredentials: true }),
			axios.get(`${API_URL}/v1/activities`, { withCredentials: true })
		])

		const kiosk = kioskResponse.data as KioskTypeNonPopulated
		const activities = activitiesResponse.data as ActivityType[]

		const associatedActivities = activities.filter(activity =>
			kiosk.activities.some(kioskActivity => kioskActivity._id === activity._id)
		)

		setActivityCount(associatedActivities.length)
	}, [API_URL])

	const fetchKioskInfo = useCallback(async () => {
		const kioskResponse = await axios.get(`${API_URL}/v1/kiosks/me`, { withCredentials: true })
		const kiosk = kioskResponse.data as KioskTypeNonPopulated
		setKioskId(kiosk._id)
		setHasReader(kiosk.readerId !== null)
	}, [API_URL])

	const fetchProductsAndOptions = useCallback(async () => {
		const productsResponse = await axios.get(`${API_URL}/v1/products`, { withCredentials: true })
		const products = productsResponse.data as ProductType[]
		products.forEach(product => {
			product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
		})
		setProducts(products)

		const optionsResponse = await axios.get(`${API_URL}/v1/options`, { withCredentials: true })
		const options = optionsResponse.data as OptionType[]
		setOptions(options)
	}, [API_URL])

	const redirectToActivitySelection = useCallback(() => {
		router.push('/orderstation')
	}, [router])

	const validateActivityAndRedirect = useCallback(() => {
		axios.get(`${API_URL}/v1/activities/${params.activity}`, { withCredentials: true })
			.catch(() => { redirectToActivitySelection() })
	}, [API_URL, params.activity, redirectToActivitySelection])

	// Fetch products and options on mount
	useEffect(() => {
		if (API_URL === null) return
		fetchProductsAndOptions().catch(addError)
	}, [API_URL, fetchProductsAndOptions, addError])

	// Validate activity on mount
	useEffect(() => {
		if (API_URL === null) return
		validateActivityAndRedirect()
	}, [API_URL, validateActivityAndRedirect])

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
	}, [cart, products, options])

	// Fetch activity name
	useEffect(() => {
		axios.get(`${API_URL}/v1/activities/${params.activity}`, { withCredentials: true })
			.then(response => { setActivityName(response.data.name as string) })
			.catch(addError)
	}, [API_URL, params.activity, addError])

	// Fetch number of activities for kiosk
	useEffect(() => {
		if (API_URL === null) return
		fetchActivityCount().catch(addError)
	}, [API_URL, fetchActivityCount, addError])

	// Fetch kiosk info
	useEffect(() => {
		if (API_URL === null) return
		fetchKioskInfo().catch(addError)
	}, [API_URL, fetchKioskInfo, addError])

	useInterval(fetchProductsAndOptions, 1000 * 60 * 60) // Fetch products and options every hour
	useInterval(validateActivityAndRedirect, 1000 * 60 * 60) // Validate activity every hour

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
	}, [cart, setCart])

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

	const submitOrder = useCallback((type: 'Cash' | 'Card'): void => {
		setOrderStatus('loading')
		setIsOrderConfirmationVisible(true)

		const productCart = Object.entries(cart.products).map(([item, quantity]) => ({ id: item, quantity }))
		const optionCart = Object.entries(cart.options).map(([item, quantity]) => ({ id: item, quantity }))

		const data = {
			kioskId,
			activityId: params.activity,
			products: productCart,
			options: optionCart,
			skipCheckout: type === 'Cash'
		}

		axios.post(`${API_URL}/v1/orders`, data, { withCredentials: true })
			.then(res => {
				setOrder(res.data as OrderType)
				if (type === 'Card') {
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
	}, [API_URL, cart, params.activity, kioskId, addError])

	const handleSubmit = useCallback(() => {
		if (hasReader) {
			setIsSelectPaymentWindowVisible(true)
		} else {
			submitOrder('Cash')
		}
	}, [hasReader, submitOrder])

	const reset = useCallback((): void => {
		if (activityCount > 1) {
			router.push('/orderstation')
		}
		setCart({ products: {}, options: {} })
		setIsOrderConfirmationVisible(false)
		setOrderStatus('loading')
	}, [activityCount, router])

	return (
		<main>
			<div className="flex h-screen">
				<div className="flex-1 overflow-y-auto">
					<div className="flex flex-row justify-center p-1 items-center">
						<h1 className="text-2xl font-bold text-center text-gray-800">
							{'Bestil til ' + activityName}
						</h1>
						{activityCount > 1 &&
							<button
								onClick={redirectToActivitySelection}
								className="bg-blue-500 text-white rounded-md mx-2 py-2 px-4"
								type="button"
							>
								{'Skift Aktivitet'}
							</button>
						}
					</div>
					<SelectionWindow
						products={products}
						handleCartChange={handleCartChange}
					/>
				</div>
				<div className="w-[300px] h-screen overflow-y-auto">
					<CartWindow
						price={totalPrice}
						products={products}
						options={options}
						cart={cart}
						onCartChange={handleCartChange}
						onSubmit={handleSubmit}
						formIsValid={isFormValid}
					/>
				</div>
			</div>
			<div>
				{isOrderConfirmationVisible &&
					<OrderConfirmationWindow
						price={totalPrice}
						orderStatus={orderStatus}
						onClose={reset}
					/>
				}
			</div>
			<div>
				{isSelectPaymentWindowVisible &&
					<SelectPaymentWindow
						onCancel={() => { setIsSelectPaymentWindowVisible(false) }}
						onSubmit={type => {
							submitOrder(type)
							setIsOrderConfirmationVisible(true)
							setIsSelectPaymentWindowVisible(false)
						}}
					/>
				}
			</div>
		</main>
	)
}
