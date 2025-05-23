'use client'

import axios from 'axios'
import dayjs from 'dayjs'
import { type ReactElement, useState, useEffect, useCallback } from 'react'
import { FiMessageSquare, FiMail, FiUser, FiCalendar, FiEye, FiEyeOff, FiRefreshCw } from 'react-icons/fi'
import 'dayjs/locale/da'

import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { useSocket } from '@/hooks/CudWebsocket'
import useCUDOperations from '@/hooks/useCUDOperations'
import { formatRelativeDateLabel } from '@/lib/timeUtils'
import type { FeedbackType, PatchFeedbackType, PostFeedbackType } from '@/types/backendDataTypes'

export default function Page (): ReactElement {
	dayjs.locale('da')

	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const [feedbackList, setFeedbackList] = useState<FeedbackType[]>([])
	const [loading, setLoading] = useState(true)
	const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('unread')

	const { updateEntityAsync } = useCUDOperations<PostFeedbackType, PatchFeedbackType, FeedbackType>(
		'/v1/feedback'
	)

	useSocket<FeedbackType>('feedback', { setState: setFeedbackList })

	const fetchFeedback = useCallback(async () => {
		try {
			const response = await axios.get<FeedbackType[]>(`${API_URL}/v1/feedback`, {
				withCredentials: true
			})
			setFeedbackList(response.data.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()))
		} catch (error) {
			addError(error)
		}
	}, [API_URL, addError, setFeedbackList])

	// Fetch all initial data
	useEffect(() => {
		if (API_URL != null) {
			setLoading(true)
			fetchFeedback()
				.then(() => {
					setLoading(false)
					return null
				})
				.catch((error) => {
					addError(error)
					setLoading(false)
				})
		}
	}, [API_URL, fetchFeedback, addError])

	const handleToggleReadStatus = async (feedbackItem: FeedbackType): Promise<void> => {
		try {
			const updatedFeedbackData: PatchFeedbackType = { isRead: !feedbackItem.isRead }
			await updateEntityAsync(feedbackItem._id, updatedFeedbackData)
		} catch (error) {
			addError(error)
		}
	}

	const filteredFeedbackList = feedbackList.filter(item => {
		if (filter === 'all') { return true }
		if (filter === 'read') { return item.isRead }
		if (filter === 'unread') { return !item.isRead }
		return true
	}).sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())

	return (
		<div className="max-w-7xl mx-auto p-4 md:p-6 text-black">
			<header className="mb-6">
				<h1 className="text-3xl font-bold text-gray-800 flex items-center">
					<FiMessageSquare className="mr-3 text-blue-600" />
					{'Brugerfeedback'}
				</h1>
				<p className="text-gray-600 mt-1">{'Gennemse og administrer feedback sendt af brugere.'}</p>
			</header>

			<div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
				<div className="flex space-x-2">
					{(['unread', 'read', 'all'] as const).map(f => (
						<button
							key={f}
							onClick={() => setFilter(f)}
							className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
                                ${filter === f
							? 'bg-blue-600 text-white'
							: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
						}`}
						>
							{f === 'unread' ? 'Ulæst' : f === 'read' ? 'Læst' : 'Alle'}
						</button>
					))}
				</div>
			</div>

			{loading && (
				<div className="text-center py-10">
					<FiRefreshCw className="text-4xl text-blue-600 animate-spin mx-auto" />
					<p className="mt-2 text-gray-600">{'Henter feedback...'}</p>
				</div>
			)}

			{!loading && filteredFeedbackList.length === 0 && (
				<div className="text-center py-10 bg-gray-50 rounded-lg shadow">
					<FiMail className="text-5xl text-gray-400 mx-auto" />
					<p className="mt-3 text-xl text-gray-700">{'Ingen feedback fundet'}</p>
					<p className="text-gray-500">
						{filter === 'unread' ? 'Der er ingen ulæste beskeder.' : filter === 'read' ? 'Der er ingen læste beskeder.' : 'Der er ingen feedback endnu.'}
					</p>
				</div>
			)}

			{!loading && filteredFeedbackList.length > 0 && (
				<div className="space-y-4">
					{filteredFeedbackList.map(item => (
						<div
							key={item._id}
							className={`bg-white shadow-lg rounded-lg p-5 border-l-4 ${item.isRead ? 'border-gray-300 opacity-70' : 'border-blue-500'
							}`}
						>
							<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
								<div className="flex items-center mb-2 sm:mb-0">
									{(item.name != null) && (
										<>
											<FiUser className="text-gray-500 mr-2" />
											<span className="font-semibold text-gray-800 mr-3">{item.name}</span>
										</>
									)}
									<FiCalendar className="text-gray-500 mr-1" />
									<span className="text-sm text-gray-600">{formatRelativeDateLabel(item.createdAt)}</span>
								</div>
								<button
									onClick={async () => await handleToggleReadStatus(item)}
									title={item.isRead ? 'Marker som ulæst' : 'Marker som læst'}
									className={`p-2 rounded-full transition-colors text-sm flex items-center
                                        ${item.isRead
							? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
							: 'bg-blue-100 hover:bg-blue-200 text-blue-700'
						}`}
								>
									{item.isRead ? <FiEyeOff className="mr-1" /> : <FiEye className="mr-1" />}
									{item.isRead ? 'Marker ulæst' : 'Marker læst'}
								</button>
							</div>
							<p className="text-gray-700 whitespace-pre-wrap">{item.feedback}</p>
							{item.isRead && item.updatedAt !== item.createdAt && (
								<p className="text-xs text-gray-500 mt-2 text-right">
									{'Læst: '}{formatRelativeDateLabel(item.updatedAt)}
								</p>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
}
