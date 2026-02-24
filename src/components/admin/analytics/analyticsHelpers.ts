import type { InteractionType, KioskType, OrderType } from '@/types/backendDataTypes'

import type { InteractionTypeValue } from '@/types/interactionTypes'

export interface SessionAnalysis {
	sessionId: string
	kioskId: string
	duration: number
	interactionCount: number
	cartModifications: number
	productAdditions: number
	hasTimeout: boolean
	hasCheckoutComplete: boolean
	hasCheckoutStart: boolean
	hasPaymentFailure: boolean
	hasPaymentCancelled: boolean
	lastViewState: string
	endReason: 'completed' | 'timeout' | 'abandoned' | 'manual_end'
	timeToFirstAction: number | null
	maxIdleGap: number
	interactions: InteractionType[]
	startTime: Date
	endTime: Date
	orderId: string | null
	isFeedbackOnly: boolean
}

export interface PercentileStats {
	avg: number
	median: number
	p90: number
	p95: number
	min: number
	max: number
	count: number
}

export function formatDuration (ms: number): string {
	const seconds = ms / 1000
	return `${seconds.toFixed(2)}s`
}

export function roundPercent (value: number, decimals: number = 1): number {
	const factor = Math.pow(10, decimals)
	return Math.round(value * factor) / factor
}

const AUTO_INTERACTION_TYPES: InteractionTypeValue[] = [
	'session_start',
	'activity_auto_select',
	'room_auto_select',
	'nav_auto_to_activity',
	'nav_auto_to_room',
	'nav_auto_to_order',
	'payment_auto_later',
	'session_timeout',
	'confirmation_timeout',
	'feedback_auto_back'
]

export function isAutoInteraction (type: InteractionTypeValue): boolean {
	return AUTO_INTERACTION_TYPES.includes(type)
}

export function getKioskName (kioskId: string, kiosks: KioskType[]): string {
	const kiosk = kiosks.find(k => k._id === kioskId)
	return kiosk?.name ?? kioskId.slice(-6)
}

export function getInteractionIcon (type: InteractionTypeValue): string {
	const icons: Record<InteractionTypeValue, string> = {
		session_start: '▶️',
		session_timeout: '⏰',
		activity_select: '🎯',
		activity_auto_select: '⚡',
		room_select: '🚪',
		room_auto_select: '⚡',
		nav_to_welcome: '🏠',
		nav_to_activity: '🎯',
		nav_to_room: '🚪',
		nav_to_order: '🛒',
		nav_auto_to_activity: '⚡',
		nav_auto_to_room: '⚡',
		nav_auto_to_order: '⚡',
		timeout_warning_shown: '⏳',
		timeout_continue: '▶️',
		timeout_restart: '🔄',
		product_select: '➕',
		product_increase: '➕',
		product_decrease: '➖',
		option_select: '➕',
		option_increase: '➕',
		option_decrease: '➖',
		cart_clear: '🗑️',
		checkout_start: '💳',
		payment_select_later: '🪙',
		payment_select_card: '💳',
		payment_select_mobilepay: '📱',
		payment_auto_later: '⚡',
		checkout_cancel: '🚫',
		payment_cancel: '🚫',
		checkout_complete: '✅',
		checkout_failed: '❌',
		confirmation_feedback_positive: '👍',
		confirmation_feedback_negative: '👎',
		confirmation_close: '✖️',
		confirmation_timeout: '⏰',
		feedback_banner_click: '💬',
		feedback_positive: '👍',
		feedback_negative: '👎',
		feedback_back: '⬅️',
		feedback_auto_back: '⏰'
	}
	return icons[type] ?? '❓'
}

export function getInteractionLabel (type: InteractionTypeValue): string {
	const labels: Record<InteractionTypeValue, string> = {
		session_start: 'Session startet',
		session_timeout: 'Session timeout',
		activity_select: 'Aktivitet valgt',
		activity_auto_select: 'Aktivitet auto-valgt',
		room_select: 'Lokale valgt',
		room_auto_select: 'Lokale auto-valgt',
		nav_to_welcome: 'Navigation til velkomst',
		nav_to_activity: 'Navigation til aktivitet',
		nav_to_room: 'Navigation til lokale',
		nav_to_order: 'Navigation til bestilling',
		nav_auto_to_activity: 'Auto-navigation til aktivitet',
		nav_auto_to_room: 'Auto-navigation til lokale',
		nav_auto_to_order: 'Auto-navigation til bestilling',
		timeout_warning_shown: 'Timeout-advarsel vist',
		timeout_continue: 'Fortsæt efter timeout-advarsel',
		timeout_restart: 'Start forfra efter timeout-advarsel',
		product_select: 'Produkt tilføjet',
		product_increase: 'Produkt mængde øget',
		product_decrease: 'Produkt mængde reduceret',
		option_select: 'Tilvalg tilføjet',
		option_increase: 'Tilvalg mængde øget',
		option_decrease: 'Tilvalg mængde reduceret',
		cart_clear: 'Kurv ryddet',
		checkout_start: 'Checkout startet',
		payment_select_later: 'Betal senere valgt',
		payment_select_card: 'Kort valgt',
		payment_select_mobilepay: 'MobilePay valgt',
		payment_auto_later: 'Auto betal senere (gratis)',
		checkout_cancel: 'Checkout annulleret',
		payment_cancel: 'Betaling annulleret',
		checkout_complete: 'Checkout gennemført',
		checkout_failed: 'Checkout fejlet',
		confirmation_feedback_positive: 'Positiv feedback (bekræftelse)',
		confirmation_feedback_negative: 'Negativ feedback (bekræftelse)',
		confirmation_close: 'Bekræftelse lukket',
		confirmation_timeout: 'Bekræftelse timeout',
		feedback_banner_click: 'Feedback banner klik',
		feedback_positive: 'Positiv feedback',
		feedback_negative: 'Negativ feedback',
		feedback_back: 'Feedback tilbage',
		feedback_auto_back: 'Feedback auto-tilbage'
	}
	return labels[type] ?? type
}

export function calcPercentileStats (values: number[]): PercentileStats {
	if (values.length === 0) {
		return { avg: 0, median: 0, p90: 0, p95: 0, min: 0, max: 0, count: 0 }
	}
	const sorted = [...values].sort((a, b) => a - b)
	const sum = sorted.reduce((acc, v) => acc + v, 0)
	const avg = sum / sorted.length
	const median = sorted[Math.floor(sorted.length / 2)]
	const p90 = sorted[Math.floor(sorted.length * 0.9)]
	const p95 = sorted[Math.floor(sorted.length * 0.95)]
	const min = sorted[0]
	const max = sorted[sorted.length - 1]
	return { avg, median, p90, p95, min, max, count: sorted.length }
}

function determineLastViewState (interactions: InteractionType[]): string {
	let currentPage = 'welcome'

	for (const interaction of interactions) {
		const type = interaction.type

		if (type === 'session_start') {
			currentPage = 'welcome'
		} else if (type === 'nav_to_welcome') {
			currentPage = 'welcome'
		} else if (type === 'nav_to_activity') {
			currentPage = 'activity'
		} else if (type === 'nav_to_room') {
			currentPage = 'room'
		} else if (type === 'nav_to_order') {
			currentPage = 'order'
		} else if (type === 'checkout_start') {
			currentPage = 'checkout'
		} else if (type === 'checkout_complete') {
			currentPage = 'confirmation'
		} else if (type === 'checkout_failed' || type === 'checkout_cancel' || type === 'payment_cancel') {
			currentPage = 'order'
		} else if (type === 'timeout_restart') {
			currentPage = 'welcome'
		}
	}

	return currentPage
}

export function analyzeSession (
	sessionInteractions: InteractionType[],
	orders: OrderType[]
): SessionAnalysis {
	const sorted = [...sessionInteractions].sort((a, b) => {
		const timeDiff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
		if (timeDiff !== 0) { return timeDiff }
		return a._id.localeCompare(b._id)
	})

	const sessionStartIndex = sorted.findIndex(i => i.type === 'session_start')
	const sessionFiltered = sessionStartIndex >= 0 ? sorted.slice(sessionStartIndex) : sorted

	const sessionId = sessionFiltered[0]?.sessionId ?? ''
	const kioskId = sessionFiltered[0]?.kioskId ?? ''
	const startTime = new Date(sessionFiltered[0]?.timestamp ?? Date.now())
	const endTime = new Date(sessionFiltered[sessionFiltered.length - 1]?.timestamp ?? Date.now())
	const duration = endTime.getTime() - startTime.getTime()

	const hasTimeout = sessionFiltered.some(i => i.type === 'session_timeout')
	const hasCheckoutComplete = sessionFiltered.some(i => i.type === 'checkout_complete')
	const hasCheckoutStart = sessionFiltered.some(i => i.type === 'checkout_start')

	const cartModifications = sessionFiltered.filter(i =>
		['product_decrease', 'option_decrease', 'cart_clear'].includes(i.type)
	).length
	const productAdditions = sessionFiltered.filter(i =>
		['product_select', 'product_increase', 'option_select', 'option_increase'].includes(i.type)
	).length

	const hasFeedbackBack = sorted.some(i => i.type === 'feedback_back' || i.type === 'feedback_auto_back')

	const feedbackOnlyTypes: InteractionTypeValue[] = [
		'session_start', 'nav_to_welcome', 'feedback_banner_click',
		'feedback_positive', 'feedback_negative', 'feedback_back', 'feedback_auto_back'
	]
	const isFeedbackOnly = sorted.every(i => feedbackOnlyTypes.includes(i.type)) &&
		sorted.some(i => i.type === 'feedback_banner_click')

	let endReason: SessionAnalysis['endReason'] = 'manual_end'
	if (hasCheckoutComplete) { endReason = 'completed' } else if (hasTimeout) { endReason = 'timeout' } else if (hasCheckoutStart && !hasCheckoutComplete) { endReason = 'abandoned' } else if (hasFeedbackBack) { endReason = 'completed' }

	const lastViewState = determineLastViewState(sessionFiltered)

	let timeToFirstAction: number | null = null
	const firstManualInteraction = sessionFiltered.find(i => !isAutoInteraction(i.type))
	if (firstManualInteraction !== undefined && sessionFiltered[0]?.type === 'session_start') {
		timeToFirstAction = new Date(firstManualInteraction.timestamp).getTime() - startTime.getTime()
	}

	const hasPaymentFailure = sessionFiltered.some(i => i.type === 'checkout_failed')
	const hasPaymentCancelled = sessionFiltered.some(i => i.type === 'payment_cancel')

	let maxIdleGap = 0
	for (let i = 1; i < sessionFiltered.length; i++) {
		const prevType = sessionFiltered[i - 1].type
		if (prevType === 'session_start') { continue }
		const gap = new Date(sessionFiltered[i].timestamp).getTime() - new Date(sessionFiltered[i - 1].timestamp).getTime()
		if (gap > maxIdleGap) { maxIdleGap = gap }
	}

	const sessionOrders = orders.filter(o =>
		new Date(o.createdAt) >= startTime &&
		new Date(o.createdAt) <= new Date(endTime.getTime() + 60000)
	)
	const orderId = sessionOrders[0]?._id ?? null

	return {
		sessionId,
		kioskId,
		duration,
		interactionCount: sessionFiltered.length,
		cartModifications,
		productAdditions,
		hasTimeout,
		hasCheckoutComplete,
		hasCheckoutStart,
		hasPaymentFailure,
		hasPaymentCancelled,
		lastViewState,
		endReason,
		timeToFirstAction,
		maxIdleGap,
		interactions: sessionFiltered,
		startTime,
		endTime,
		orderId,
		isFeedbackOnly
	}
}

export function groupInteractionsBySession (interactions: InteractionType[]): Map<string, InteractionType[]> {
	const sessions = new Map<string, InteractionType[]>()
	for (const interaction of interactions) {
		const existing = sessions.get(interaction.sessionId) ?? []
		existing.push(interaction)
		sessions.set(interaction.sessionId, existing)
	}
	return sessions
}
