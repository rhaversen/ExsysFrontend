'use client'
import React, {
	createContext,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
	type ReactElement,
	useContext,
	useEffect,
	useState
} from 'react'

import { type AdminType, type KioskType } from '@/types/backendDataTypes'

type UserType = KioskType | AdminType

interface UserContextType {
	currentUser: UserType | null
	setCurrentUser: Dispatch<SetStateAction<UserType | null>>
}

const UserContext = createContext<UserContextType>({
	currentUser: null,
	setCurrentUser: () => { }
})

export const useUser = (): UserContextType => useContext(UserContext)

export default function UserProvider ({ children }: { readonly children: ReactNode }): ReactElement {
	const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
		if (typeof window !== 'undefined') {
			const storedUser = localStorage.getItem('currentUser')
			return (storedUser !== null) ? JSON.parse(storedUser) : null
		}
		return null
	})

	useEffect(() => {
		if (currentUser !== null) {
			localStorage.setItem('currentUser', JSON.stringify(currentUser))
		} else {
			localStorage.removeItem('currentUser')
		}
	}, [currentUser])

	const value = React.useMemo(() => ({
		currentUser,
		setCurrentUser
	}), [currentUser, setCurrentUser])

	return (
		<UserContext.Provider value={value}>
			{children}
		</UserContext.Provider>
	)
}
