'use client'
import React, { useEffect, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useInterval } from 'react-use'
import { useError } from './ErrorContext/ErrorContext'

export default function KioskAuthProvider ({ children }: { children: ReactNode }): ReactNode {
	const router = useRouter()
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const checkAuthentication = useCallback(async (): Promise<void> => {
		try {
			await axios.get(`${API_URL}/v1/auth/is-authenticated`, { withCredentials: true })
		} catch {
			router.push('/login-admin')
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
