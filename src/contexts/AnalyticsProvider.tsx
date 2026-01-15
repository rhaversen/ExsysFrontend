'use client'

import axios from 'axios'
import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react'

import { type InteractionType } from '@/types/frontendDataTypes'

interface Interaction {
	type: InteractionType
	timestamp: string
}

interface AnalyticsContextType {
	track: (type: InteractionType) => void
	endSession: () => Promise<void>
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null)

const API_URL = process.env.NEXT_PUBLIC_API_URL

export function AnalyticsProvider ({ children }: { children: ReactNode }): ReactNode {
	const sessionIdRef = useRef<string>(crypto.randomUUID())
	const interactionsRef = useRef<Interaction[]>([])

	const track = useCallback((type: InteractionType) => {
		interactionsRef.current.push({
			type,
			timestamp: new Date().toISOString()
		})
	}, [])

	const endSession = useCallback(async () => {
		if (interactionsRef.current.length === 0) {
			sessionIdRef.current = crypto.randomUUID()
			return
		}

		try {
			await axios.post(`${API_URL}/v1/interactions`, {
				sessionId: sessionIdRef.current,
				interactions: interactionsRef.current
			}, { withCredentials: true })
		} catch (error) {
			console.error('Failed to send analytics:', error)
		}

		interactionsRef.current = []
		sessionIdRef.current = crypto.randomUUID()
	}, [])

	return (
		<AnalyticsContext.Provider value={{ track, endSession }}>
			{children}
		</AnalyticsContext.Provider>
	)
}

export function useAnalytics (): AnalyticsContextType {
	const context = useContext(AnalyticsContext)
	if (!context) {
		throw new Error('useAnalytics must be used within an AnalyticsProvider')
	}
	return context
}
