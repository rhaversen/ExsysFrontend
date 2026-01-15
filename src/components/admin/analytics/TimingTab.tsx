'use client'

import { type ReactElement, useMemo } from 'react'

import type { InteractionType, OrderType } from '@/types/backendDataTypes'

import {
	type SessionAnalysis,
	formatDuration,
	calcPercentileStats,
	analyzeSession,
	groupInteractionsBySession
} from './analyticsHelpers'

interface TimingTabProps {
	interactions: InteractionType[]
	orders: OrderType[]
}

export default function TimingTab ({
	interactions,
	orders
}: TimingTabProps): ReactElement {
	const sessions = useMemo(() => {
		const grouped = groupInteractionsBySession(interactions)
		const analyzed: SessionAnalysis[] = []
		grouped.forEach((sessionInteractions) => {
			const session = analyzeSession(sessionInteractions, orders)
			if (!session.isFeedbackOnly) {
				analyzed.push(session)
			}
		})
		return analyzed
	}, [interactions, orders])

	const timeToCheckout = useMemo(() => {
		const times = sessions
			.filter(s => s.hasCheckoutComplete)
			.map(s => s.duration)
		return calcPercentileStats(times)
	}, [sessions])

	const timeToFirstAction = useMemo(() => {
		const times = sessions
			.filter(s => !s.hasTimeout)
			.map(s => s.timeToFirstAction)
			.filter((t): t is number => t !== null)
		return calcPercentileStats(times)
	}, [sessions])

	const indecisiveness = useMemo(() => {
		const mods = sessions.map(s => s.cartModifications)
		return calcPercentileStats(mods)
	}, [sessions])

	const timePerView = useMemo(() => {
		const viewTimes: Record<string, number[]> = {
			welcome: [],
			activity: [],
			room: [],
			order: [],
			checkout: [],
			feedback: []
		}

		for (const session of sessions) {
			let currentView = 'welcome'
			let viewStart = session.startTime.getTime()

			for (const interaction of session.interactions) {
				const time = new Date(interaction.timestamp).getTime()
				const type = interaction.type

				let nextView = currentView
				if (type === 'nav_to_welcome' || type === 'session_start') {
					nextView = 'welcome'
				} else if (type.includes('activity')) {
					nextView = 'activity'
				} else if (type.includes('room')) {
					nextView = 'room'
				} else if (type === 'nav_to_order' || type.includes('product') || type.includes('option') || type.includes('cart')) {
					nextView = 'order'
				} else if (type.includes('checkout') || type.includes('payment')) {
					nextView = 'checkout'
				} else if (type.includes('confirmation') || type.includes('feedback')) {
					nextView = 'feedback'
				}

				if (nextView !== currentView) {
					const duration = time - viewStart
					if (duration > 0 && currentView in viewTimes) {
						viewTimes[currentView].push(duration)
					}
					currentView = nextView
					viewStart = time
				}
			}

			const finalDuration = session.endTime.getTime() - viewStart
			if (finalDuration > 0 && currentView in viewTimes) {
				viewTimes[currentView].push(finalDuration)
			}
		}

		return Object.entries(viewTimes).map(([view, times]) => ({
			view,
			stats: calcPercentileStats(times)
		}))
	}, [sessions])

	const cartModificationStats = useMemo(() => {
		const productAdds = interactions.filter(i =>
			['product_select', 'product_increase', 'option_select', 'option_increase'].includes(i.type)
		).length
		const productRemoves = interactions.filter(i =>
			['product_decrease', 'option_decrease'].includes(i.type)
		).length
		const cartClears = interactions.filter(i => i.type === 'cart_clear').length

		return { productAdds, productRemoves, cartClears, total: productAdds + productRemoves + cartClears }
	}, [interactions])

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<h3 className="font-semibold text-gray-800 mb-3">{'Tid til checkout'}</h3>
					<div className="space-y-1 text-sm">
						<div className="flex justify-between">
							<span>{'Gennemsnit'}</span>
							<span className="font-medium">{formatDuration(timeToCheckout.avg)}</span>
						</div>
						<div className="flex justify-between">
							<span>{'Median'}</span>
							<span className="font-medium">{formatDuration(timeToCheckout.median)}</span>
						</div>
						<div className="flex justify-between text-gray-500">
							<span>{'Antal'}</span>
							<span>{timeToCheckout.count}</span>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<h3 className="font-semibold text-gray-800 mb-3">{'Tid til første handling'}</h3>
					<div className="space-y-1 text-sm">
						<div className="flex justify-between">
							<span>{'Gennemsnit'}</span>
							<span className="font-medium">{formatDuration(timeToFirstAction.avg)}</span>
						</div>
						<div className="flex justify-between">
							<span>{'Median'}</span>
							<span className="font-medium">{formatDuration(timeToFirstAction.median)}</span>
						</div>
						<div className="flex justify-between text-gray-500">
							<span>{'Antal'}</span>
							<span>{timeToFirstAction.count}</span>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
					<h3 className="font-semibold text-gray-800 mb-3">{'Ubeslutsom adfærd'}</h3>
					<div className="space-y-1 text-sm">
						<div className="flex justify-between">
							<span>{'Gns. ændringer pr. session'}</span>
							<span className="font-medium">{indecisiveness.avg.toFixed(1)}</span>
						</div>
						<div className="flex justify-between">
							<span>{'Median'}</span>
							<span className="font-medium">{indecisiveness.median.toFixed(0)}</span>
						</div>
						<div className="flex justify-between text-gray-500">
							<span>{'Max'}</span>
							<span>{indecisiveness.max}</span>
						</div>
					</div>
				</div>
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
				<h3 className="font-semibold text-gray-800 mb-4">{'Tid per visning'}</h3>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left border-b border-gray-200">
								<th className="pb-2 pr-4">{'Visning'}</th>
								<th className="pb-2 pr-4 text-right">{'Gns.'}</th>
								<th className="pb-2 pr-4 text-right">{'Median'}</th>
								<th className="pb-2 pr-4 text-right">{'P90'}</th>
								<th className="pb-2 pr-4 text-right">{'P95'}</th>
								<th className="pb-2 pr-4 text-right">{'Min'}</th>
								<th className="pb-2 pr-4 text-right">{'Max'}</th>
								<th className="pb-2 text-right">{'Antal'}</th>
							</tr>
						</thead>
						<tbody>
							{timePerView.map(({ view, stats }) => (
								<tr key={view} className="border-b border-gray-100 last:border-b-0">
									<td className="py-2 pr-4 capitalize font-medium">{view}</td>
									<td className="py-2 pr-4 text-right">{formatDuration(stats.avg)}</td>
									<td className="py-2 pr-4 text-right">{formatDuration(stats.median)}</td>
									<td className="py-2 pr-4 text-right">{formatDuration(stats.p90)}</td>
									<td className="py-2 pr-4 text-right">{formatDuration(stats.p95)}</td>
									<td className="py-2 pr-4 text-right">{formatDuration(stats.min)}</td>
									<td className="py-2 pr-4 text-right">{formatDuration(stats.max)}</td>
									<td className="py-2 text-right">{stats.count}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
				<h3 className="font-semibold text-gray-800 mb-4">{'Kurv ændringer'}</h3>
				<div className="space-y-3">
					<div className="flex justify-between text-sm">
						<span>{'Tilføjelser'}</span>
						<span className="text-green-600 font-medium">{`+${cartModificationStats.productAdds}`}</span>
					</div>
					<div className="flex justify-between text-sm">
						<span>{'Fjernelser'}</span>
						<span className="text-red-600 font-medium">{`-${cartModificationStats.productRemoves}`}</span>
					</div>
					<div className="flex justify-between text-sm">
						<span>{'Kurv ryddet'}</span>
						<span className="text-yellow-600 font-medium">{cartModificationStats.cartClears}</span>
					</div>
					<div className="flex justify-between text-sm font-medium border-t border-gray-200 pt-2">
						<span>{'Total ændringer'}</span>
						<span>{cartModificationStats.total}</span>
					</div>
				</div>
			</div>
		</div>
	)
}
