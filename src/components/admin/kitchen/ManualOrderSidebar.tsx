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
		<div className="p-4 pb-20 flex flex-col gap-4">
			<h2 className="text-lg font-semibold text-gray-800">{'Manuel Ordre Indtastning'}</h2>

			<div className="space-y-2">
				<div>
					<label className="block text-xs font-medium text-gray-500 mb-1">{'Lokale'}</label>
					<select
						title='Lokale'
						value={selectedRoomId}
						onChange={(e) => setSelectedRoomId(e.target.value)}
						className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
					>
						<option disabled value="">{'Vælg...'}</option>
						{roomOptions.map(option => (
							<option key={option.value} value={option.value}>{option.label}</option>
						))}
					</select>
				</div>
				<div>
					<label className="block text-xs font-medium text-gray-500 mb-1">{'Aktivitet'}</label>
					<select
						title='Aktivitet'
						value={selectedActivityId}
						onChange={(e) => setSelectedActivityId(e.target.value)}
						className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
					>
						<option disabled value="">{'Vælg...'}</option>
						{activityOptions.map(option => (
							<option key={option.value} value={option.value}>{option.label}</option>
						))}
					</select>
				</div>
			</div>

			{currentOrderItems.length > 0 && (
				<div>
					<div className="max-h-72 overflow-y-auto space-y-3">
						{products.length > 0 && (
							<div>
								<h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{'Produkter'}</h4>
								<div className="space-y-1">
									{currentOrderItems.filter(i => i.type === 'product').map(item => (
										<div
											key={`product-${item.id}`}
											className={`flex items-center justify-between rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${item.quantity > 0 ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
											onClick={() => { handleQuantityChange(item.id, item.type, 1) }}
										>
											<span className={`text-sm truncate mr-2 ${item.quantity > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
												{item.name}
											</span>
											<div className="flex items-center gap-1 shrink-0">
												<button
													onClick={(e) => { e.stopPropagation(); handleQuantityChange(item.id, item.type, -1) }}
													className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-600 text-xs flex items-center justify-center disabled:opacity-30"
													disabled={item.quantity === 0}
												>{'-'}</button>
												{editingItem?.id === item.id && editingItem.type === item.type ? (
													<input
														aria-label='Antal'
														placeholder="0"
														type="text"
														inputMode="numeric"
														pattern="\d*"
														className="w-8 text-center border border-gray-200 rounded text-sm py-0.5"
														value={item.quantity.toString()}
														onClick={(e) => e.stopPropagation()}
														onChange={e => {
															const raw = e.currentTarget.value
															if (/^\d*$/.test(raw)) {
																const sanitized = raw.replace(/^0+(?=\d)/, '')
																const n = sanitized === '' ? 0 : parseInt(sanitized, 10)
																setCurrentOrderItems(prev =>
																	prev.map(x =>
																		x.id === item.id && x.type === item.type ? { ...x, quantity: n } : x
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
														className={`w-6 text-center text-sm ${item.quantity > 0 ? 'font-semibold text-gray-800' : 'text-gray-400'}`}
														onClick={(e) => { e.stopPropagation(); setEditingItem({ id: item.id, type: item.type }) }}
													>
														{item.quantity}
													</span>
												)}
												<button
													onClick={(e) => { e.stopPropagation(); handleQuantityChange(item.id, item.type, 1) }}
													className="w-6 h-6 rounded-full bg-green-100 hover:bg-green-200 text-green-600 text-xs flex items-center justify-center"
												>{'+'}</button>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
						{options.length > 0 && (
							<div>
								<h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{'Tilvalg'}</h4>
								<div className="space-y-1">
									{currentOrderItems.filter(i => i.type === 'option').map(item => (
										<div
											key={`option-${item.id}`}
											className={`flex items-center justify-between rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${item.quantity > 0 ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
											onClick={() => { handleQuantityChange(item.id, item.type, 1) }}
										>
											<span className={`text-sm truncate mr-2 ${item.quantity > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
												{item.name}
											</span>
											<div className="flex items-center gap-1 shrink-0">
												<button
													onClick={(e) => { e.stopPropagation(); handleQuantityChange(item.id, item.type, -1) }}
													className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-600 text-xs flex items-center justify-center disabled:opacity-30"
													disabled={item.quantity === 0}
												>{'-'}</button>
												{editingItem?.id === item.id && editingItem.type === item.type ? (
													<input
														aria-label='Antal'
														placeholder="0"
														type="text"
														inputMode="numeric"
														pattern="\d*"
														className="w-8 text-center border border-gray-200 rounded text-sm py-0.5"
														value={item.quantity.toString()}
														onClick={(e) => e.stopPropagation()}
														onChange={e => {
															const raw = e.currentTarget.value
															if (/^\d*$/.test(raw)) {
																const sanitized = raw.replace(/^0+(?=\d)/, '')
																const n = sanitized === '' ? 0 : parseInt(sanitized, 10)
																setCurrentOrderItems(prev =>
																	prev.map(x =>
																		x.id === item.id && x.type === item.type ? { ...x, quantity: n } : x
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
														className={`w-6 text-center text-sm ${item.quantity > 0 ? 'font-semibold text-gray-800' : 'text-gray-400'}`}
														onClick={(e) => { e.stopPropagation(); setEditingItem({ id: item.id, type: item.type }) }}
													>
														{item.quantity}
													</span>
												)}
												<button
													onClick={(e) => { e.stopPropagation(); handleQuantityChange(item.id, item.type, 1) }}
													className="w-6 h-6 rounded-full bg-green-100 hover:bg-green-200 text-green-600 text-xs flex items-center justify-center"
												>{'+'}</button>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
					{currentOrderItems.some(i => i.quantity > 0) && (
						<p className="text-right text-sm font-semibold text-gray-700 mt-2">{calculateTotal.toFixed(2)}{' kr'}</p>
					)}
				</div>
			)}

			<button
				type="button"
				onClick={handleSubmitOrder}
				disabled={isSubmitting || !selectedRoomId || !selectedActivityId || !currentOrderItems.some(item => item.quantity > 0)}
				className="w-full bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors hover:bg-blue-600"
			>
				{isSubmitting ? 'Opretter...' : 'Opret Ordre'}
			</button>

			{recentManualOrders.length > 0 && (
				<div>
					<h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{'Seneste Ordrer'}</h3>
					<div className="space-y-2">
						{recentManualOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
							<div key={order._id} className="border border-gray-100 rounded-lg p-3 text-sm">
								<div className="flex justify-between items-start">
									<div>
										<span className="font-medium text-gray-800">{getRoomName(order.roomId)}</span>
										<span className="text-gray-400">{' · '}</span>
										<span className="text-gray-600">{getActivityName(order.activityId)}</span>
									</div>
									<span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
										{order.status === 'delivered' ? 'Leveret' : order.status === 'confirmed' ? 'Læst' : 'Afventer'}
									</span>
								</div>
								<div className="text-xs text-gray-500 mt-1">
									{timeSince(order.createdAt)}
									<span className="text-gray-300">{' · '}</span>
									{order.products.map(p => `${p.quantity}× ${products.find(product => product._id === p._id)?.name ?? ''}`).concat(
										order.options.map(o => `${o.quantity}× ${options.find(option => option._id === o._id)?.name ?? ''}`)
									).join(', ')}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
