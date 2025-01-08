import Block from '@/components/admin/kitchen/Block'
import { useSound } from '@/contexts/SoundProvider'
import { type OrderType, type RoomType } from '@/types/backendDataTypes'
import { type UpdatedOrderType } from '@/types/frontendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'

const RoomCol = ({
	room,
	orders,
	onUpdatedOrders
}: {
	room: RoomType
	orders: OrderType[]
	onUpdatedOrders: (orders: UpdatedOrderType[]) => void
}): ReactElement => {
	const {
		isMuted,
		soundUrl
	} = useSound()
	const [ordersByActivity, setOrdersByActivity] = useState<Record<string, OrderType[]>>({})
	const [totalProducts, setTotalProducts] = useState<Record<string, number>>({})
	const [totalOptions, setTotalOptions] = useState<Record<string, number>>({})
	const prevBlockCountRef = useRef(0)
	const newOrderAlert = useMemo(() => new Audio(soundUrl), [soundUrl])

	const groupOrdersByActivity = useCallback(() => {
		const groupedOrders: Record<string, OrderType[]> = {}
		orders.forEach((order) => {
			if (groupedOrders[order.activityId] === undefined) {
				groupedOrders[order.activityId] = []
			}
			groupedOrders[order.activityId].push(order)
		})
		setOrdersByActivity(groupedOrders)
	}, [orders, setOrdersByActivity])

	useEffect(() => {
		groupOrdersByActivity()
	}, [groupOrdersByActivity])

	// Play a sound when a new block is added
	useEffect(() => {
		const currentBlockCount = Object.keys(ordersByActivity).length
		const increaseBlockCount = currentBlockCount > prevBlockCountRef.current
		if (increaseBlockCount && !isMuted) {
			newOrderAlert.play().catch(console.error)
		}
		prevBlockCountRef.current = currentBlockCount
	}, [isMuted, newOrderAlert, ordersByActivity, room])

	useEffect(() => {
		const productsCount: Record<string, number> = {}
		const optionsCount: Record<string, number> = {}

		orders.forEach(order => {
			order.products.forEach(({
				name,
				quantity
			}) => {
				productsCount[name] = (productsCount[name] ?? 0) + quantity
			})

			order.options.forEach(({
				name,
				quantity
			}) => {
				optionsCount[name] = (optionsCount[name] ?? 0) + quantity
			})
		})

		setTotalProducts(productsCount)
		setTotalOptions(optionsCount)
	}, [orders])

	return (
		<div className="rounded-lg m-1 p-1 bg-white overflow-y-auto max-w-[650px] h-full shadow-md">
			<h2 className="text-gray-800 font-bold text-3xl text-center p-1">
				{room.name}
			</h2>
			<div className="flex flex-wrap justify-center">
				{Object.keys(ordersByActivity).map((activityId) => (
					<Block
						key={activityId}
						activityId={activityId}
						orders={ordersByActivity[activityId]}
						onUpdatedOrders={onUpdatedOrders}
					/>
				))}
			</div>
			<div className="m-2">
				<h3 className="text-gray-800 font-bold text-xl text-center">
					{'Total'}
				</h3>
				<div className="flex flex-col items-center">
					<div className="text-gray-800 text-lg">
						{Object.entries(totalProducts).map(([name, quantity]) => (
							<p key={name}>{quantity}{' '}&times;{' '}{name}</p>
						))}
						{Object.entries(totalOptions).map(([name, quantity]) => (
							<p key={name}>{quantity}{' '}&times;{' '}{name}</p>
						))}
						{Object.entries(totalProducts).length === 0 && Object.entries(totalOptions).length === 0 && (
							<p>{'Intet'}</p>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default RoomCol
