import { type AdminType, type KioskType, type SessionType } from '@/types/backendDataTypes'
import { type ReactElement } from 'react'

interface ViewMode {
	type: 'admin' | 'kiosk'
	userId: string | null
	showAll: boolean
}

interface SessionGroupProps {
	title: string
	type: 'admin' | 'kiosk'
	totalSessionCount: number
	userIds: string[]
	userMap: Record<string, AdminType | KioskType>
	sessionGroups: Record<string, SessionType[]>
	viewMode: ViewMode
	currentUserId?: string | null // Optional, only relevant for admin type
	onSelect: (type: 'admin' | 'kiosk', userId: string | null, showAll: boolean) => void
}

const SessionGroup = ({
	title,
	type,
	totalSessionCount,
	userIds,
	userMap,
	sessionGroups,
	viewMode,
	currentUserId,
	onSelect
}: SessionGroupProps): ReactElement => {
	const isGroupSelected = viewMode.type === type && viewMode.showAll

	return (
		<div>
			<h3
				className={`group py-2 px-3 rounded-md flex items-center mb-2 cursor-pointer transition-colors duration-150 ${
					isGroupSelected
						? 'bg-blue-100 text-blue-900 font-bold'
						: 'text-gray-700 font-semibold hover:bg-gray-200' // Changed hover background to gray-200
				}`}
				onClick={() => { onSelect(type, null, true) }}
			>
				<span className="flex-grow">{title}</span>
				<span
					className={`rounded-full w-5 h-5 flex items-center justify-center text-xs ml-2 transition-colors duration-150 ${// Added transition
						isGroupSelected
							? 'bg-blue-200 text-blue-800'
							: 'bg-gray-200 text-gray-800 group-hover:bg-gray-300 group-hover:text-gray-900' // Added group-hover styles
					}`}
				>
					{totalSessionCount}
				</span>
			</h3>

			<div className="space-y-1">
				{userIds.map(userId => {
					const user = userMap[userId]
					const sessionCount = sessionGroups[userId]?.length ?? 0
					const isUserSelected = viewMode.type === type && viewMode.userId === userId && !viewMode.showAll
					const isCurrentUser = type === 'admin' && userId === currentUserId

					return (
						<button
							type="button"
							key={userId}
							className={`group w-full text-left px-3 py-1 rounded flex items-center transition-colors duration-150 ${// Added transition
								isUserSelected
									? 'bg-blue-100 text-blue-900'
									: 'text-gray-800 hover:bg-gray-200' // Restored hover:bg-gray-200
							}`}
							onClick={() => { onSelect(type, userId, false) }}
						>
							<div className={`flex items-center flex-grow overflow-hidden ${isUserSelected ? 'font-semibold' : 'font-medium'}`}>
								<span className="truncate">
									{user?.name ?? (type === 'admin' ? 'Ukendt Navn' : 'Ukendt navn')}
								</span>
								{isCurrentUser && (
									<span
										className={`ml-2 flex-shrink-0 text-xs px-1.5 rounded-sm transition-colors duration-150 ${// Added transition
											isUserSelected
												? 'bg-blue-200 text-blue-800'
												: 'bg-gray-200 text-gray-700 group-hover:bg-gray-300 group-hover:text-gray-900' // Added group-hover styles
										}`}
									>
										{'Dig\r'}
									</span>
								)}
							</div>
							<span
								className={`rounded-full w-5 h-5 flex items-center justify-center text-xs ml-2 flex-shrink-0 transition-colors duration-150 ${// Added transition
									isUserSelected ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800 group-hover:bg-gray-300 group-hover:text-gray-900' // Added group-hover styles
								}`}
							>
								{sessionCount}
							</span>
						</button>
					)
				})}

				{userIds.length === 0 && (
					<div className="text-sm text-gray-500 italic px-3">{`Ingen ${type === 'admin' ? 'admin' : 'kiosk'} sessioner`}</div>
				)}
			</div>
		</div>
	)
}

export default SessionGroup
