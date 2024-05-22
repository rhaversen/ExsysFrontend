import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

import { type OrderType } from '@/lib/backendDataTypes'
import { type OrderTypeWithNames } from '@/lib/frontendDataTypes'
import axios from 'axios'
import { useError } from '@/contexts/ErrorContext/ErrorContext'

const Block = ({
	orders,
	timeBlock,
	onUpdatedOrders
}: {
	orders: OrderTypeWithNames[]
	timeBlock: string
	onUpdatedOrders: (orders: OrderType[]) => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const [pendingOrders, setPendingOrders] = useState<Record<string, number>>({})
	const [confirmedOrders, setConfirmedOrders] = useState<Record<string, number>>({})
	const [orderStatus, setOrderStatus] = useState<OrderType['status']>(orders[0].status)
	const [showConfirmDelivered, setShowConfirmDelivered] = useState(false)

	const countOrders = useCallback((orders: OrderTypeWithNames[]) => {
		const counts: Record<string, number> = {}
		orders.forEach((order) => {
			order.products.forEach((product) => {
				if (counts[product.name] === undefined) {
					counts[product.name] = 0
				}
				counts[product.name] += 1
			})
			order.options.forEach((option) => {
				if (counts[option.name] === undefined) {
					counts[option.name] = 0
				}
				counts[option.name] += 1
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

	const patchOrders = useCallback((status: OrderType['status']) => {
		axios.patch(API_URL + '/v1/orders', {
			orders: orders.map((order) => order._id),
			status
		}).then((response) => {
			const data = response.data as OrderType[]
			onUpdatedOrders(data)
		}).catch((error: any) => {
			addError(error)
		})
	}, [API_URL, orders, onUpdatedOrders, addError])

	useEffect(() => {
		const pending = orders.filter((order) => order.status === 'pending')
		const confirmed = orders.filter((order) => order.status === 'confirmed')

		const pendingOrdersCount = countOrders(pending)
		const confirmedOrdersCount = countOrders(confirmed)

		setPendingOrders(pendingOrdersCount)
		setConfirmedOrders(confirmedOrdersCount)
	}, [orders, setPendingOrders, setConfirmedOrders, countOrders])

	useEffect(() => {
		setOrderStatus(determineOrderStatus())
	}, [setOrderStatus, determineOrderStatus])

	return (
		<div
			className={`text-gray-800 mx-4 mb-4 p-2 shadow-md border-2 ${orderStatus === 'pending' ? 'bg-blue-300' : ''} border-slate-800 rounded-md`}>
			<h3 className="text-center text-xl ">{timeBlock}</h3>
			{Object.keys({ ...pendingOrders, ...confirmedOrders }).sort().map((name) => {
				const confirmedCount = confirmedOrders[name] ?? 0
				const pendingCount = pendingOrders[name] ?? 0
				const totalCount = pendingCount + confirmedCount
				const diff = pendingCount
				const diffText = diff > 0 ? ` (+${diff})` : diff < 0 ? ` (-${Math.abs(diff)})` : ''

				return (
					<p key={name}>
						{totalCount} {name}{diffText}
					</p>
				)
			})}
			<div className="mt-2">
				{orderStatus === 'pending' &&
					<button type="button" className="rounded bg-blue-500 p-2 hover:bg-blue-600 text-white w-full"
						onClick={() => {
							patchOrders('confirmed')
						}}>Marker som læst
					</button>
				}
				{orderStatus === 'confirmed' &&
					<button type="button" className="rounded bg-orange-500 p-2 hover:bg-orange-600 w-full"
						onClick={() => {
							setShowConfirmDelivered(true)
						}}>Marker som leveret
					</button>
				}
			</div>
			{showConfirmDelivered &&
				<div className="fixed inset-0 flex items-center justify-center bg-black/50 z-10">
					<button
						type="button"
						className="absolute inset-0 w-full h-full"
						onClick={() => {
							setShowConfirmDelivered(false)
						}}
					>
						<span className="sr-only">
							{'Close'}
						</span>
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
									patchOrders('delivered')
								}}
							>
								{'Marker som leveret'}
							</button>

						</div>
					</div>

				</div>
			}
		</div>
	)
}

export default Block
