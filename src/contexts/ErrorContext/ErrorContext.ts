import { createContext, useContext } from 'react'

export interface ErrorInfo {
	id: number
	error: string[]
}

interface ErrorContextType {
	errors: ErrorInfo[]
	addError: (...args: unknown[]) => void
	removeError: (id: number) => void
}

export const ErrorContext = createContext<ErrorContextType>({
	errors: [],
	addError: () => {
	},
	removeError: () => {
	}
})

export const useError = (): ErrorContextType => useContext(ErrorContext)
