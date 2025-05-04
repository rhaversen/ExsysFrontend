'use client'

import { isAxiosError } from 'axios'
import React, { type ReactNode, useCallback, useState } from 'react'

import ErrorWindow from '@/components/ui/ErrorWindow'
import { ErrorContext, type ErrorInfo } from '@/contexts/ErrorContext/ErrorContext'

/**
 * Parses various error inputs into an array of readable message strings.
 */
export function parseError (...args: unknown[]): string[] {
	const err = args[0]

	// Skip and return empty for auth-related axios errors
	if (isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
		return []
	}

	// Extract API payload if present
	if (isAxiosError(err)) {
		const data = err.response?.data
		if (
			data !== null &&
			typeof data === 'object' &&
			'error' in data &&
			typeof (data as { error?: unknown }).error === 'string'
		) {
			const msg = (data as { error: string }).error
			return [msg]
		}
	}

	const items = Array.isArray(err) ? err : [err]
	return items.map(item => {
		if (typeof item === 'string') {
			return item
		}
		if (
			item !== null &&
			typeof item === 'object' &&
			'message' in item &&
			typeof (item as { message?: unknown }).message === 'string'
		) {
			return (item as { message: string }).message
		}

		return String(item)
	})
}

interface ErrorProviderProps {
	children: ReactNode
}

const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
	const [errors, setErrors] = useState<ErrorInfo[]>([])

	const addError = useCallback((...args: unknown[]) => {
		const messages = parseError(...args)
		if (messages.length === 0) { return }
		console.error(...args)
		setErrors(prev => [...prev, { id: Date.now(), error: messages }])
	}, [])

	const removeError = useCallback((id: number) => {
		setErrors(prevErrors => prevErrors.filter(error => error.id !== id))
	}, [])

	return (
		<ErrorContext.Provider
			value={{
				errors,
				addError,
				removeError
			}}
		>
			{children}
			<div className="fixed top-5 right-0 z-50">
				{errors.map((error) => (
					<ErrorWindow
						key={error.id}
						error={error.error}
						onClose={() => removeError(error.id)}
					/>
				))}
			</div>
		</ErrorContext.Provider>
	)
}

export default ErrorProvider
