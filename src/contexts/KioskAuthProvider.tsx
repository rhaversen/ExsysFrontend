'use client'
import React, { useEffect, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useInterval } from 'react-use'

export default function KioskAuthProvider ({ children }: { children: ReactNode }): ReactNode {
	const router = useRouter()
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const checkAuthentication = useCallback(async (): Promise<void> => {
		try {
			await axios.get(`${API_URL}/v1/auth/is-authenticated`, { withCredentials: true })
		} catch {
			router.push('/login-kiosk')
		}
	}, [API_URL, router])

	// Run the authentication check on component mount
	useEffect(() => {
		checkAuthentication().catch(console.error)
	}, [checkAuthentication])

	// Continue running the authentication check every 10 seconds
	useInterval(() => {
		checkAuthentication().catch(console.error)
	}, 1000 * 10)

	return <>{children}</>
}
