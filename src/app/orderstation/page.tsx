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

	// Helper function to fetch data with error handling
	const fetchData = async (url: string, config = {}): Promise<any> => {
		const response = await axios.get(url, { withCredentials: true, ...config })
		return response.data
	}

	// Fetch products and options
	const loadProductsAndOptions = useCallback(async (): Promise<void> => {
		const [productsData, optionsData] = await Promise.all([
			fetchData(`${API_URL}/v1/products`),
			fetchData(`${API_URL}/v1/options`)
		])

		const processedProducts: ProductType[] = productsData.map((product: ProductType) => ({
			...product,
			orderWindow: convertOrderWindowFromUTC(product.orderWindow)
		}))

		setProducts(processedProducts)
		setOptions(optionsData as OptionType[])
	}, [API_URL])

	// Fetch kiosk information
	const loadKioskInfo = useCallback(async (): Promise<void> => {
		const kioskData: KioskTypeNonPopulated = await fetchData(`${API_URL}/v1/kiosks/me`)
		setKiosk(kioskData)
		setCheckoutMethods(prev => ({
			...prev,
			sumUp: kioskData.readerId !== null
		}))
	}, [API_URL])

	// Fetch activities and related kiosk activities
	const loadActivities = useCallback(async (): Promise<void> => {
		const [kioskData, activitiesData]: [KioskTypeNonPopulated, ActivityType[]] = await Promise.all([
			fetchData(`${API_URL}/v1/kiosks/me`),
			fetchData(`${API_URL}/v1/activities`)
		])

		const kioskActivities = activitiesData.filter(activity =>
			kioskData.activities.some(kioskActivity => kioskActivity._id === activity._id)
		)

		setActivities(kioskActivities)

		if (kioskActivities.length === 1) {
			setSelectedActivity(kioskActivities[0])
		}
	}, [API_URL])

	// Initial data fetching on component mount
	useEffect(() => {
		if (API_URL === undefined || API_URL === null || API_URL === '') return

		Promise.all([
			loadProductsAndOptions(),
			loadKioskInfo(),
			loadActivities()
		]).catch(addError)
	}, [API_URL, addError, loadActivities, loadKioskInfo, loadProductsAndOptions])

	// Set up intervals to refetch data every hour
	useInterval(loadProductsAndOptions, 1000 * 60 * 60) // Every hour
	useInterval(loadActivities, 1000 * 60 * 60) // Every hour
	useInterval(loadKioskInfo, 1000 * 60 * 60) // Every hour

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
