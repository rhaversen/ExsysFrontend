import { useState, type ReactElement, useCallback, useMemo, useEffect } from 'react'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import useCUDOperations from '@/hooks/useCUDOperations'
import { timeSince } from '@/lib/timeUtils'
import { type ActivityType, type OptionType, type OrderType, type PostOrderType, type ProductType, type RoomType } from '@/types/backendDataTypes'

interface ManualOrderItem {
	id: string
	name: string
	type: 'product' | 'option'
	quantity: number
	price: number
}

export default function ManualOrderSidebar ({
	rooms,
	activities,
	products,
	options,
	recentManualOrders
}: {
	rooms: RoomType[]
	activities: ActivityType[]
	products: ProductType[]
	options: OptionType[]
	recentManualOrders: OrderType[]
}): ReactElement {
	const { addError } = useError()
	const { createEntityAsync } = useCUDOperations<PostOrderType, never, OrderType>('/v1/orders')

	const [selectedRoomId, setSelectedRoomId] = useState<string>('')
	const [selectedActivityId, setSelectedActivityId] = useState<string>('')
	const [currentOrderItems, setCurrentOrderItems] = useState<ManualOrderItem[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [, setTick] = useState(0)
	const [editingItem, setEditingItem] = useState<{ id: string; type: 'product' | 'option' } | null>(null)

	const roomOptions = useMemo(() => rooms.map(r => ({ value: r._id, label: r.name })), [rooms])
	const activityOptions = useMemo(() => activities.map(a => ({ value: a._id, label: a.name })), [activities])

	useEffect(() => {
		const initialItems: ManualOrderItem[] = [
			...products.map(p => ({
				id: p._id,
				name: p.name,
				type: 'product' as const,
				quantity: 0,
				price: p.price
			})),
			...options.map(o => ({
				id: o._id,
				name: o.name,
				type: 'option' as const,
				quantity: 0,
				price: o.price
			}))
		]
		setCurrentOrderItems(initialItems)
	}, [products, options])

	const handleQuantityChange = useCallback((itemId: string, type: 'product' | 'option', delta: number) => {
		setCurrentOrderItems(prevItems => prevItems.map(item => {
			if (item.id === itemId && item.type === type) {
				const newQuantity = item.quantity + delta
				return { ...item, quantity: Math.max(0, newQuantity) }
			}
			return item
		}))
	}, [])

	useEffect(() => {
		const intervalId = setInterval(() => {
			setTick(prevTick => prevTick + 1)
		}, 60000)
		return () => { clearInterval(intervalId) }
	}, [])

	const handleSubmitOrder = useCallback(async () => {
		const hasItemsWithQuantity = currentOrderItems.some(item => item.quantity > 0)
		if (!selectedRoomId || !selectedActivityId || !hasItemsWithQuantity) {
			addError('Vælg venligst lokale, aktivitet og mindst én vare.')
			return
		}

		setIsSubmitting(true)
		try {
			const orderData: PostOrderType = {
				roomId: selectedRoomId,
				activityId: selectedActivityId,
				products: currentOrderItems
					.filter(item => item.type === 'product' && item.quantity > 0)
					.map(item => ({ id: item.id, quantity: item.quantity })),
				options: currentOrderItems
					.filter(item => item.type === 'option' && item.quantity > 0)
					.map(item => ({ id: item.id, quantity: item.quantity })),
				checkoutMethod: 'manual',
				kioskId: undefined
			}
			await createEntityAsync(orderData)
			setSelectedRoomId('')
			setSelectedActivityId('')
			setCurrentOrderItems(prevItems =>
				prevItems.map(item => ({ ...item, quantity: 0 }))
			)
		} catch (error) {
			addError(error)
		} finally {
			setIsSubmitting(false)
		}
	}, [selectedRoomId, selectedActivityId, currentOrderItems, createEntityAsync, addError])

	const calculateTotal = useMemo(() => {
		return currentOrderItems.reduce((total, item) => total + (item.price * item.quantity), 0)
	}, [currentOrderItems])

	const getActivityName = useCallback((id: string) => activities.find(a => a._id === id)?.name ?? 'Ukendt', [activities])
	const getRoomName = useCallback((id: string) => rooms.find(r => r._id === id)?.name ?? 'Ukendt', [rooms])

	return (
		<div className="pb-25 h-full bg-gray-100 px-4 border-l border-gray-300 flex flex-col">
			<h2 className="text-lg font-medium text-gray-700 bg-gray-100 py-2">{'Manuel Ordre Indtastning'}</h2>
			<div className="p-3 bg-white rounded shadow">
				<div>
					<label className="block text-sm font-medium text-gray-600 mb-1">{'Lokale'}</label>
					<select
						title='Lokale'
						value={selectedRoomId}
						onChange={(e) => setSelectedRoomId(e.target.value)}
						className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
					>
						<option disabled value="">
							{'Vælg Lokale...'}
						</option>
						{roomOptions.map(option => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>
				<div className="mt-2">
					<label className="block text-sm font-medium text-gray-600 mb-1">{'Aktivitet'}</label>
					<select
						title='Aktivitet'
						value={selectedActivityId}
						onChange={(e) => setSelectedActivityId(e.target.value)}
						className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none sm:text-sm rounded-md"
					>
						<option disabled value="">
							{'Vælg Aktivitet...'}
						</option>
						{activityOptions.map(option => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>
				{/* Current Order Items */}
				{currentOrderItems.length > 0 && (
					<div className="mb-4 border-t pt-3 mt-3">
						<h4 className="text-md font-medium mb-2 text-gray-700">{'Valgte Varer:'}</h4>
						<ul className="space-y-2 max-h-60 overflow-y-auto text-sm">
							{currentOrderItems.map(item => (
								<li
									key={`${item.type}-${item.id}`}
									className={`flex justify-between items-center p-1 rounded overflow-hidden ${item.quantity === 0 ? 'bg-gray-100' : 'bg-gray-50'}`}
								>
									<span className={`flex-1 truncate mr-2 ${item.quantity === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
										{item.name}
									</span>
									<div className="flex items-center space-x-1">
										<button
											onClick={() => { handleQuantityChange(item.id, item.type, -1) }}
											className={`text-red-500 px-1 rounded hover:bg-red-100 ${item.quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
											disabled={item.quantity === 0}
										>
											{'-'}
										</button>
										{editingItem?.id === item.id && editingItem.type === item.type ? (
											<input
												aria-label='Antal'
												placeholder="0"
												type="text"
												inputMode="numeric"
												pattern="\d*"
												className="w-8 text-center border rounded"
												value={item.quantity.toString()}
												onChange={e => {
													const raw = e.currentTarget.value
													if (/^\d*$/.test(raw)) {
														const sanitized = raw.replace(/^0+(?=\d)/, '')
														const n = sanitized === '' ? 0 : parseInt(sanitized, 10)
														setCurrentOrderItems(prev =>
															prev.map(x =>
																x.id === item.id && x.type === item.type
																	? { ...x, quantity: n }
																	: x
															)
														)
													}
												}}
												onBlur={() => setEditingItem(null)}
												onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur() } }}
												autoFocus
											/>
										) : (
											<span
												className="w-5 text-center text-gray-800"
												onClick={() => setEditingItem({ id: item.id, type: item.type })}
											>
												{item.quantity}
											</span>
										)}
										<button
											onClick={() => { handleQuantityChange(item.id, item.type, 1) }}
											className="text-green-500 px-1 rounded hover:bg-green-100"
										>
											{'+'}
										</button>
									</div>
								</li>
							))}
						</ul>
						<p className="text-right font-semibold mt-2 text-gray-800">{'Total: '}{calculateTotal.toFixed(2)}{' kr'}</p>
					</div>
				)}
				<button
					type="button"
					onClick={handleSubmitOrder}
					disabled={isSubmitting || !selectedRoomId || !selectedActivityId || !currentOrderItems.some(item => item.quantity > 0)}
					className="w-full bg-blue-500 text-white py-2 px-4 rounded disabled:opacity-50 transition-colors disabled:hover:bg-blue-500 hover:bg-blue-600"
				>
					{isSubmitting ? 'Opretter...' : 'Opret Manuel Ordre'}
				</button>
			</div>
			<div className="mt-2">
				<h3 className="text-lg font-medium text-gray-700 bg-gray-100 py-2">{'Seneste Manuelle Ordrer'}</h3>
				{recentManualOrders.length === 0
					? <p className="text-sm text-gray-500">{'Ingen nylige manuelle ordrer.'}</p>
					: (
						<ul className="space-y-3">
							{recentManualOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
								<li key={order._id} className="bg-white p-3 rounded shadow text-sm">
									<p className="font-semibold text-gray-800">{'Lokale: '}{getRoomName(order.roomId)}</p>
									<p className="font-semibold text-gray-800">{'Aktivitet: '}{getActivityName(order.activityId)}</p>
									<p className="text-gray-600">{'Oprettet: '}{timeSince(order.createdAt)}</p>
									<ul className="mt-2 text-xs space-y-1 pl-2 border-l ml-1">
										{order.products.map(p => (
											<li key={p._id}>{p.quantity}{' x '}{p.name}</li>
										))}
										{order.options.map(o => (
											<li key={o._id}>{o.quantity}{' x '}{o.name}</li>
										))}
									</ul>
									<p className="text-xs text-gray-500 mt-1">{'Status: '}{order.status === 'confirmed' ? 'Læst' : order.status === 'delivered' ? 'Leveret' : 'Afventer'}</p>
								</li>
							))}
						</ul>
					)}
			</div>
		</div>
	)
}
