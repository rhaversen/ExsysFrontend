'use client'

import ActivitySelection from '@/components/orderstation/ActivitySelection'
import OrderView from '@/components/orderstation/OrderView'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { convertOrderWindowFromUTC } from '@/lib/timeUtils'
import {
	type ActivityType,
	type KioskTypeNonPopulated,
	type OptionType,
	type ProductType
} from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import { useInterval } from 'react-use'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [kiosk, setKiosk] = useState<KioskTypeNonPopulated | null>(null)
	const [checkoutMethods, setCheckoutMethods] = useState({
		sumUp: false,
		cash: false,
		mobilePay: false
	})
	const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null)
	const [activities, setActivities] = useState<ActivityType[]>([])

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

	const fetchKioskInfo = useCallback(async () => {
		const kioskResponse = await axios.get(`${API_URL}/v1/kiosks/me`, { withCredentials: true })
		const kiosk = kioskResponse.data as KioskTypeNonPopulated
		setKiosk(kiosk)
		setCheckoutMethods(prev => ({
			...prev,
			sumUp: kiosk.readerId !== null
		}))
	}, [API_URL])

	const fetchActivities = useCallback(async () => {
		const [kioskResponse, activitiesResponse] = await Promise.all([
			axios.get(`${API_URL}/v1/kiosks/me`, { withCredentials: true }),
			axios.get(`${API_URL}/v1/activities`, { withCredentials: true })
		])

		const kiosk = kioskResponse.data as KioskTypeNonPopulated
		const activities = activitiesResponse.data as ActivityType[]

		const kioskActivities = activities.filter(activity =>
			kiosk.activities.some(kioskActivity => kioskActivity._id === activity._id)
		)

		if (kioskActivities.length === 1) {
			setSelectedActivity(activities[0])
		}

		setActivities(kioskActivities)
	}, [API_URL, setActivities])

	useEffect(() => {
		if (API_URL === null) return
		fetchActivities().catch((error) => {
			addError(error)
		})
	}, [API_URL, addError, fetchActivities])

	// Fetch products and options on mount
	useEffect(() => {
		if (API_URL === null) return
		fetchProductsAndOptions().catch(addError)
	}, [API_URL, fetchProductsAndOptions, addError])

	// Fetch kiosk info
	useEffect(() => {
		if (API_URL === null) return
		fetchKioskInfo().catch(addError)
	}, [API_URL, fetchKioskInfo, addError])

	useInterval(fetchProductsAndOptions, 1000 * 60 * 60) // Fetch products and options every hour
	useInterval(fetchActivities, 1000 * 60 * 60) // Fetch activities every hour

	return (
		<div>
			{selectedActivity === null && (
				<ActivitySelection
					activities={activities}
					onActivitySelect={setSelectedActivity}
				/>
			)}
			{selectedActivity !== null && kiosk !== null && (
				<OrderView
					kiosk={kiosk}
					products={products}
					options={options}
					activity={selectedActivity}
					checkoutMethods={checkoutMethods}
					onClose={() => { setSelectedActivity(null) }}
				/>
			)}
		</div>
	)
}
