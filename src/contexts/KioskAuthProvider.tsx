'use client'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { type ReactNode, useCallback, useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

import useEntitySocketListeners from '@/hooks/CudWebsocket'
import { type SessionType } from '@/types/backendDataTypes'

import { useError } from './ErrorContext/ErrorContext'
import { useUser } from './UserProvider'

export default function KioskAuthProvider ({ children }: Readonly<{ children: ReactNode }>): ReactNode {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const WS_URL = process.env.NEXT_PUBLIC_WS_URL

	const { addError } = useError()
	const { setCurrentUser } = useUser()
	const router = useRouter()

	const [currentSession, setCurrentSession] = useState<string | null>(null)
	const [socket, setSocket] = useState<Socket | null>(null)

	const checkAuthentication = useCallback(async (): Promise<void> => {
		try {
			const response = await axios.get<string>(`${API_URL}/v1/auth/is-authenticated`, { withCredentials: true })
			setCurrentSession(response.data)
		} catch {
			// If not authenticated, log out and redirect to kiosk login page
			setCurrentUser(null)
			setCurrentSession(null)
			await axios.post(`${API_URL}/v1/auth/logout-local`, { withCredentials: true })
			router.push('/login-kiosk')
		}
	}, [API_URL, router, setCurrentUser])

	const checkAuthorization = useCallback(async (): Promise<void> => {
		try {
			// Check if user is a kiosk
			await axios.get(`${API_URL}/v1/auth/is-kiosk`, { withCredentials: true })
			// If kiosk, do nothing (let them stay on the current page)
		} catch {
			// If not kiosk, redirect to login page
			router.push('/login-kiosk')
		}
	}, [API_URL, router])

	// Run the authentication and authorization checks on component mount
	useEffect(() => {
		if (currentSession === null) {
			checkAuthentication().then(checkAuthorization).catch(addError)
		}
	}, [currentSession, checkAuthentication, checkAuthorization, addError])

	// Initialize WebSocket connection
	useEffect(() => {
		if (API_URL === undefined || API_URL === null || API_URL === '') return
		const socketInstance = io(WS_URL)
		setSocket(socketInstance)

		return () => {
			socketInstance.disconnect()
		}
	}, [API_URL, WS_URL])

	// Listen for session CUD events
	useEntitySocketListeners<SessionType>(
		socket,
		'session',
		() => { /* Do nothing for create */ },
		() => { /* Do nothing for update */ },
		(deletedSessionId) => {
			// If the current session is deleted, log out the user
			if (deletedSessionId === currentSession) {
				setCurrentUser(null)
				setCurrentSession(null)
				router.push('/login-kiosk')
			}
		}
	)

	return <>{children}</>
}
