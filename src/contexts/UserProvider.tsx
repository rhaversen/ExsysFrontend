'use client'

import axios from 'axios'
import Cookies from 'js-cookie'
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
	setCurrentUser: () => {}
})

export const useUser = (): UserContextType => useContext(UserContext)

export default function UserProvider ({ children }: { readonly children: ReactNode }): ReactElement {
	const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
		if (typeof window !== 'undefined') {
			const cookie = Cookies.get('currentUser')
			return (cookie != null) ? JSON.parse(cookie) : null
		}
		return null
	})

	// Fetch current user from backend if not set
	useEffect(() => {
		if (currentUser === null && typeof window !== 'undefined') {
			const API_URL = process.env.NEXT_PUBLIC_API_URL
			const fetchUser = async () => {
				try {
					// Try admin endpoint first
					const adminRes = await axios.get<AdminType>(`${API_URL}/v1/admins/me`, { withCredentials: true })
					setCurrentUser(adminRes.data)
					return
				} catch {}
				try {
					// Try kiosk endpoint if not admin
					const kioskRes = await axios.get<KioskType>(`${API_URL}/v1/kiosks/me`, { withCredentials: true })
					setCurrentUser(kioskRes.data)
					return
				} catch {}
			}
			fetchUser()
		}
	}, [currentUser])

	useEffect(() => {
		if (currentUser !== null) {
			Cookies.set('currentUser', JSON.stringify(currentUser), { expires: 365, path: '/' })
		} else {
			Cookies.remove('currentUser', { path: '/' })
		}
	}, [currentUser])

	const value = React.useMemo(() => ({
		currentUser,
		setCurrentUser
	}), [currentUser])

	return (
		<UserContext.Provider value={value}>
			{children}
		</UserContext.Provider>
	)
}
