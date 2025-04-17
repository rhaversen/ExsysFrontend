import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useSound } from '@/contexts/SoundProvider'
import { type OrderType } from '@/types/backendDataTypes'
import { type UpdatedOrderType } from '@/types/frontendDataTypes'

interface BlockProps {
	orders: OrderType[]
	activityName: string
	onUpdatedOrders: (orders: UpdatedOrderType[]) => void
}

const Block = ({ orders, activityName, onUpdatedOrders }: BlockProps): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()
	const { isMuted, soundUrl } = useSound()

	const [localOrders, setLocalOrders] = useState<OrderType[]>([])
	const [blockStatus, setBlockStatus] = useState<OrderType['status']>('pending')
	const [showConfirmDelivered, setShowConfirmDelivered] = useState(false)
	const newOrderAlert = useMemo(() => new Audio(soundUrl), [soundUrl])
	const prevStatus = useRef(blockStatus)

	const [pendingOrders, setPendingOrders] = useState<Record<string, number>>({})
	const [confirmedOrders, setConfirmedOrders] = useState<Record<string, number>>({})

	useEffect(() => {
		setLocalOrders(orders)
	}, [orders])

	useEffect(() => {
		const statuses = localOrders.map(o => o.status)
		if (statuses.every(s => s === 'delivered')) setBlockStatus('delivered')
		else if (statuses.every(s => s === 'confirmed' || s === 'delivered')) {
			setBlockStatus('confirmed')
		} else {
			setBlockStatus('pending')
		}
	}, [localOrders])

	useEffect(() => {
		if (!isMuted && prevStatus.current === 'confirmed' && blockStatus === 'pending') {
			newOrderAlert.play().catch(() => {})
		}
		prevStatus.current = blockStatus
	}, [blockStatus, isMuted, newOrderAlert])

	const countOrders = useCallback((orders: OrderType[]) => {
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

	const patchOrders = useCallback(async (status: OrderType['status']) => {
		try {
			const response = await axios.patch<OrderType[]>(`${API_URL}/v1/orders`, {
				orderIds: localOrders.map(o => o._id),
				status
			}, { withCredentials: true })
			onUpdatedOrders(response.data)
		} catch (err: any) {
			addError(err)
		}
	}, [API_URL, localOrders, onUpdatedOrders, addError])

	useEffect(() => {
		const pending = localOrders.filter(order => order.status === 'pending')
		const confirmed = localOrders.filter(order => order.status === 'confirmed')

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
							patchOrders('confirmed').catch(addError)
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
									patchOrders('delivered').catch(addError)
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
