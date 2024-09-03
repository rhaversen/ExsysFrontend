'use client'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { type ReactNode, useCallback, useEffect } from 'react'
import { useInterval } from 'react-use'
import { useError } from './ErrorContext/ErrorContext'

export default function KioskAuthProvider ({ children }: Readonly<{ children: ReactNode }>): ReactNode {
	const router = useRouter()
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const checkAuthentication = useCallback(async (): Promise<void> => {
		try {
			await axios.get(`${API_URL}/v1/auth/is-kiosk`, { withCredentials: true })
		} catch {
			// Logout the user if they are not authenticated
			await axios.post(`${API_URL}/v1/auth/logout-local`, { withCredentials: true })
			// Redirect to the login page
			router.push('/login-kiosk')
		}
	}, [API_URL, router])

	// Run the authentication check on component mount
	useEffect(() => {
		checkAuthentication().catch(addError)
	}, [addError, checkAuthentication])

	// Continue running the authentication check every 10 seconds
	useInterval(() => {
		checkAuthentication().catch(addError)
	}, 1000 * 10)

	return <>{children}</>
}
