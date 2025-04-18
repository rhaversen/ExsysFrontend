'use client'

import { isAxiosError } from 'axios'
import React, { type ReactNode, useCallback, useState } from 'react'

import ErrorWindow from '@/components/ui/ErrorWindow'
import { ErrorContext, type ErrorInfo } from '@/contexts/ErrorContext/ErrorContext'

interface ErrorProviderProps {
	children: ReactNode
}

const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
	const [errors, setErrors] = useState<ErrorInfo[]>([])

	const addError = useCallback((...args: unknown[]) => {
		const err = args[0]
		if (isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
			return
		}
		console.error(...args)
		setErrors(prevErrors => [...prevErrors, {
			id: Date.now(),
			error: args
		}])
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
						onClose={() => {
							removeError(error.id)
						}}
					/>
				))}
			</div>
		</ErrorContext.Provider>
	)
}

export default ErrorProvider
