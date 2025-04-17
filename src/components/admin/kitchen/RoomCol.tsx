import React, { type ReactElement, useMemo, useRef, useEffect } from 'react'

import Block from '@/components/admin/kitchen/Block'
import { useSound } from '@/contexts/SoundProvider'
import { type OrderType, type RoomType } from '@/types/backendDataTypes'
import { type UpdatedOrderType } from '@/types/frontendDataTypes'

const RoomCol = ({
	room,
	orders,
	onUpdatedOrders,
	activityMap
}: {
	room: RoomType
	orders: OrderType[]
	onUpdatedOrders: (orders: UpdatedOrderType[]) => void
	activityMap: Record<string, string>
}): ReactElement => {
	const { isMuted, soundUrl } = useSound()
	const blockCountRef = useRef(-1)
	const newBlockAlert = useMemo(() => new Audio(soundUrl), [soundUrl])

	// Group by activity
	const ordersByActivity = useMemo(() => {
		const grouped: Record<string, OrderType[]> = {}
		orders.forEach(o => {
			const key = o.activityId
			if (grouped[key] === undefined) grouped[key] = []
			grouped[key].push(o)
		})
		return grouped
	}, [orders])

	useEffect(() => {
		const newCount = Object.keys(ordersByActivity).length
		if (newCount > 0 && !isMuted && newCount > blockCountRef.current) {
			newBlockAlert.play().catch(() => {})
		}
		blockCountRef.current = newCount
	}, [ordersByActivity, isMuted, newBlockAlert])

	// Compute totals
	const { totalProducts, totalOptions } = useMemo(() => {
		const productsCount: Record<string, number> = {}
		const optionsCount: Record<string, number> = {}
		orders.forEach(({ products, options }) => {
			products.forEach(({ name, quantity }) => {
				productsCount[name] = (productsCount[name] ?? 0) + quantity
			})
			options.forEach(({ name, quantity }) => {
				optionsCount[name] = (optionsCount[name] ?? 0) + quantity
			})
		})
		return { totalProducts: productsCount, totalOptions: optionsCount }
	}, [orders])

	return (
		<div className="rounded-lg m-1 p-1 bg-white overflow-y-auto max-w-[650px] h-full shadow-md">
			<h2 className="text-gray-800 font-bold text-3xl text-center p-1">
				{room.name}
			</h2>
			<div className="flex flex-wrap justify-center">
				{Object.keys(ordersByActivity).map(activityId => (
					<Block
						key={activityId}
						activityName={activityMap[activityId] ?? 'Ukendt Aktivitet'}
						orders={ordersByActivity[activityId]}
						onUpdatedOrders={onUpdatedOrders}
					/>
				))}
			</div>
			<div className="m-2">
				<h3 className="text-gray-800 font-bold text-xl text-center">
					{'Total'}
				</h3>
				<div className="flex flex-col items-center text-gray-800 text-lg">
					{Object.entries(totalProducts).map(([name, qty]) => (
						<p key={name}>{qty} &times; {name}</p>
					))}
					{Object.entries(totalOptions).map(([name, qty]) => (
						<p key={name}>{qty} &times; {name}</p>
					))}
					{Object.entries(totalProducts).length === 0 &&
						Object.entries(totalOptions).length === 0 && (
						<p>{'Intet'}</p>
					)}
				</div>
			</div>
		</div>
	)
}

export default RoomCol
