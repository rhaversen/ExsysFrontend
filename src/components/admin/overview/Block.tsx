import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type ActivityType, type OrderType, type PatchOrderType } from '@/types/backendDataTypes'
import { type OrderTypeWithNames } from '@/types/frontendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'

const Block = ({
	orders,
	activityId,
	onUpdatedOrders
}: {
	orders: OrderTypeWithNames[]
	activityId: string
	onUpdatedOrders: (orders: OrderType[]) => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const [pendingOrders, setPendingOrders] = useState<Record<string, number>>({})
	const [confirmedOrders, setConfirmedOrders] = useState<Record<string, number>>({})
	const [orderStatus, setOrderStatus] = useState<OrderType['status']>(orders[0].status)
	const [showConfirmDelivered, setShowConfirmDelivered] = useState(false)
	const [activityName, setActivityName] = useState('')

	// Ref to store the previous orders for reverting in case of failure
	const previousOrdersRef = useRef<OrderType[]>([])

	const getActivityName = useCallback(() => {
		const response = axios.get(`${API_URL}/v1/activities/${activityId}`, { withCredentials: true })
		response.then((response) => {
			const data = response.data as ActivityType
			setActivityName(data.name)
		}).catch((error: any) => {
			addError(error)
		})
	}, [API_URL, activityId, addError])

	const countOrders = useCallback((orders: OrderTypeWithNames[]) => {
		const counts: Record<string, number> = {}
		orders.forEach((order) => {
			order.products.forEach((product) => {
				if (counts[product.name] === undefined) {
					counts[product.name] = 0
				}
				counts[product.name] += product.quantity
			})
			order.options.forEach((option) => {
				if (counts[option.name] === undefined) {
					counts[option.name] = 0
				}
				counts[option.name] += option.quantity
			})
		})
		return counts
	}, [])

	const determineOrderStatus = useCallback(() => {
		// Set the status to the most severe status (pending > confirmed > delivered)
		const statuses = orders.map((order) => order.status)
		if (statuses.includes('pending')) {
			return 'pending'
		}
		if (statuses.includes('confirmed')) {
			return 'confirmed'
		}
		return 'delivered'
	}, [orders])

	const patchOrders = useCallback(
		async (status: PatchOrderType['status']) => {
			// Store the previous state of orders
			const previousOrders = orders.map(order => ({ ...order }))
			previousOrdersRef.current = previousOrders

			// Optimistically update the orders
			const updatedOrders = orders.map(order => ({
				...order,
				status
			}))

			onUpdatedOrders(updatedOrders)

			try {
				const orderPatch: PatchOrderType = {
					orderIds: orders.map(order => order._id),
					status
				}

				// Perform the patch request to the server
				const response = await axios.patch<OrderType[]>(`${API_URL}/v1/orders`, orderPatch, {
					withCredentials: true
				})

				// If successful, update the state with the server response
				onUpdatedOrders(response.data)
			} catch (error: any) {
				// If the patch request fails, revert to the previous state
				onUpdatedOrders(previousOrdersRef.current)
				addError(error)
			}
		},
		[API_URL, orders, onUpdatedOrders, addError]
	)

	const handlePatchOrders = useCallback((orderStatus: PatchOrderType['status']) => {
		patchOrders(orderStatus).catch(addError)
	}, [patchOrders, addError])

	useEffect(() => {
		const pending = orders.filter(order => order.status === 'pending')
		const confirmed = orders.filter(order => order.status === 'confirmed')

		const pendingOrdersCount = countOrders(pending)
		const confirmedOrdersCount = countOrders(confirmed)

		setPendingOrders(pendingOrdersCount)
		setConfirmedOrders(confirmedOrdersCount)
	}, [orders, countOrders])

	useEffect(() => {
		setOrderStatus(determineOrderStatus())
	}, [determineOrderStatus])

	useEffect(() => {
		getActivityName()
	}, [getActivityName])

	return (
		<div
			className={`text-gray-800 mx-4 mb-4 p-2 shadow-md border-2 ${orderStatus === 'pending' ? 'bg-blue-300' : ''} border-slate-800 rounded-md`}>
			<h3 className="text-center text-xl">{activityName}</h3>
			{Object.keys({ ...pendingOrders, ...confirmedOrders }).sort().map((name) => {
				const confirmedCount = confirmedOrders[name] ?? 0
				const pendingCount = pendingOrders[name] ?? 0
				const totalCount = pendingCount + confirmedCount
				const diff = pendingCount
				const diffText = diff > 0 ? ` (+${diff})` : diff < 0 ? ` (-${Math.abs(diff)})` : ''

				return (
					<p key={name}>
						{totalCount} &times; {name}
						{diffText}
					</p>
				)
			})}
			<div className="mt-2">
				{orderStatus === 'pending' && (
					<button
						type="button"
						className="rounded bg-blue-500 p-2 hover:bg-blue-600 text-white w-full"
						onClick={() => {
							handlePatchOrders('confirmed')
						}}
					>
						{'Marker som læst'}
					</button>
				)}
				{orderStatus === 'confirmed' && (
					<button
						type="button"
						className="rounded bg-orange-500 p-2 hover:bg-orange-600 text-white w-full"
						onClick={() => {
							setShowConfirmDelivered(true)
						}}
					>
						{'Marker som leveret'}
					</button>
				)}
			</div>
			{showConfirmDelivered && (
				<div className="fixed inset-0 flex items-center justify-center bg-black/50 z-10">
					<button
						type="button"
						className="absolute inset-0 w-full h-full"
						onClick={() => {
							setShowConfirmDelivered(false)
						}}
					>
						<span className="sr-only">{'Close'}</span>
					</button>
					<div className="absolute bg-white rounded-3xl p-10">
						<h2 className="text-lg text-center font-bold text-gray-800">{'Er du sikker på du vil markere ordren som leveret?'}</h2>
						<h3 className="text-md text-center font-bold text-gray-800">{'Denne handling kan ikke gøres om'}</h3>
						<div className="flex justify-center pt-5 gap-4">
							<button
								type="button"
								className="bg-blue-500 hover:bg-blue-600 text-white rounded-md py-2 px-4"
								onClick={() => {
									setShowConfirmDelivered(false)
								}}
							>
								{'Annuller'}
							</button>
							<button
								type="button"
								className="bg-orange-500 hover:bg-orange-600 text-white rounded-md py-2 px-4"
								onClick={() => {
									handlePatchOrders('delivered')
									setShowConfirmDelivered(false)
								}}
							>
								{'Marker som leveret'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default Block
