import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useSound } from '@/contexts/SoundProvider'
import { type OrderType, type PatchOrderType } from '@/types/backendDataTypes'
import { type UpdatedOrderType } from '@/types/frontendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface PendingUpdate {
	id: number
	status: OrderType['status']
}

interface LocalOrder extends OrderType {
	baseStatus: OrderType['status']
	pendingUpdates: PendingUpdate[]
}

interface BlockProps {
	orders: OrderType[]
	activityName: string
	onUpdatedOrders: (orders: UpdatedOrderType[]) => void
}

const Block = ({ orders, activityName, onUpdatedOrders }: BlockProps): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()
	const { isMuted, soundUrl } = useSound()

	const [localOrders, setLocalOrders] = useState<LocalOrder[]>([])
	const [pendingOrders, setPendingOrders] = useState<Record<string, number>>({})
	const [confirmedOrders, setConfirmedOrders] = useState<Record<string, number>>({})
	const [blockStatus, setBlockStatus] = useState<OrderType['status']>('pending')
	const [showConfirmDelivered, setShowConfirmDelivered] = useState(false)
	const newOrderAlert = useMemo(() => new Audio(soundUrl), [soundUrl])
	const prevLocalOrdersRef = useRef<LocalOrder[]>([])

	useEffect(() => {
		setLocalOrders(
			orders.map(order => ({
				...order,
				baseStatus: order.status,
				pendingUpdates: []
			}))
		)
	}, [orders])

	const getCurrentStatus = (order: LocalOrder): OrderType['status'] => {
		if (order.pendingUpdates.length > 0) {
			return order.pendingUpdates[order.pendingUpdates.length - 1].status
		} else {
			return order.baseStatus
		}
	}

	const countOrders = useCallback((orders: LocalOrder[]) => {
		const counts: Record<string, number> = {}
		orders.forEach(order => {
			order.products.forEach(product => {
				counts[product.name] = (counts[product.name] ?? 0) + product.quantity
			})
			order.options.forEach(option => {
				counts[option.name] = (counts[option.name] ?? 0) + option.quantity
			})
		})
		return counts
	}, [])

	const computeBlockStatus = useCallback((localOrders: LocalOrder[]) => {
		let hasPending = false
		let hasConfirmed = false
		let hasUndelivered = false
		localOrders.forEach(order => {
			const st = getCurrentStatus(order)
			if (st === 'pending') hasPending = true
			if (st === 'confirmed') hasConfirmed = true
			if (st !== 'delivered') hasUndelivered = true
		})
		if (!hasUndelivered) return 'delivered'
		if (!hasPending && (hasConfirmed || !hasUndelivered)) return 'confirmed'
		return 'pending'
	}, [])

	useEffect(() => {
		const newStatus = computeBlockStatus(localOrders)

		// Identify orders that are newly pending (not present before)
		const newlyPending = localOrders.filter(o => {
			const now = getCurrentStatus(o) === 'pending'
			const before = prevLocalOrdersRef.current.some(po => po._id === o._id && getCurrentStatus(po) === 'pending')
			return now && !before
		})

		if (blockStatus === 'confirmed' && newStatus === 'pending' && newlyPending.length > 0 && !isMuted) {
			newOrderAlert.play().catch(console.error)
		}

		setBlockStatus(newStatus)
		prevLocalOrdersRef.current = localOrders
	}, [localOrders, blockStatus, computeBlockStatus, isMuted, newOrderAlert])

	const patchOrders = useCallback(
		async (status: PatchOrderType['status']) => {
			const updateId = Date.now()

			// Optimistically update the localOrders
			setLocalOrders(prevOrders =>
				prevOrders.map(order => ({
					...order,
					pendingUpdates: [...order.pendingUpdates, { id: updateId, status }]
				}))
			)

			try {
				const orderPatch: PatchOrderType = {
					orderIds: localOrders.map(order => order._id),
					status
				}

				const response = await axios.patch<OrderType[]>(`${API_URL}/v1/orders`, orderPatch, {
					withCredentials: true
				})

				// On success, remove the pending update and update baseStatus
				setLocalOrders(prevOrders =>
					prevOrders.map(order => {
						const pendingUpdates = order.pendingUpdates.filter(u => u.id !== updateId)
						const updatedOrder = response.data.find(o => o._id === order._id)
						return {
							...order,
							baseStatus: updatedOrder !== undefined ? updatedOrder.status : order.baseStatus,
							pendingUpdates
						}
					})
				)

				onUpdatedOrders(response.data)
			} catch (error: any) {
				// On failure, remove the pending update
				setLocalOrders(prevOrders =>
					prevOrders.map(order => ({
						...order,
						pendingUpdates: order.pendingUpdates.filter(u => u.id !== updateId)
					}))
				)
				addError(error)
			}
		},
		[API_URL, localOrders, addError, onUpdatedOrders]
	)

	const handlePatchOrders = useCallback((orderStatus: PatchOrderType['status']) => {
		patchOrders(orderStatus).catch(addError)
	}, [patchOrders, addError])

	useEffect(() => {
		const pending = localOrders.filter(order => getCurrentStatus(order) === 'pending')
		const confirmed = localOrders.filter(order => getCurrentStatus(order) === 'confirmed')

		const pendingOrdersCount = countOrders(pending)
		const confirmedOrdersCount = countOrders(confirmed)

		setPendingOrders(pendingOrdersCount)
		setConfirmedOrders(confirmedOrdersCount)
	}, [localOrders, countOrders])

	return (
		<div
			className={`text-gray-800 p-2 m-1 h-full border-2 shadow-xl shadow-slate-400 border-slate-800 rounded-md ${blockStatus === 'pending' ? 'bg-blue-300' : ''}`}>
			<h3 className="text-center text-xl">{activityName}</h3>
			{Object.keys({ ...pendingOrders, ...confirmedOrders })
				.sort()
				.map(name => {
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
				{blockStatus === 'pending' && (
					<button
						type="button"
						className="rounded bg-blue-500 p-2 hover:bg-blue-600 text-white w-full"
						onClick={() => {
							handlePatchOrders('confirmed')
						}}>
						{'Marker som læst'}
					</button>
				)}
				{blockStatus === 'confirmed' && (
					<button
						type="button"
						className="rounded bg-orange-500 p-2 hover:bg-orange-600 text-white w-full"
						onClick={() => { setShowConfirmDelivered(true) }}>
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
						<h2 className="text-lg text-center font-bold text-gray-800">
							{'Er du sikker på du vil markere ordren som leveret?'}
						</h2>
						<h3 className="text-md text-center font-bold text-gray-800">
							{'Denne handling kan ikke gøres om'}
						</h3>
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
