import axios from 'axios'
import { useCallback } from 'react'

import { useError } from '@/contexts/ErrorContext/ErrorContext'

const useCUDOperations = <PostType, PatchType, ReturnType = void> (
	entityPath: string,
	preprocessItem?: (item: PostType | PatchType) => PostType | PatchType
): {
	createEntity: (data: PostType) => void
	updateEntity: (id: string, data: PatchType) => void
	deleteEntity: (id: string, confirm: boolean) => void
	createEntityAsync: (data: PostType) => Promise<ReturnType>
	updateEntityAsync: (id: string, data: PatchType) => Promise<ReturnType>
} => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const createEntity = useCallback((data: PostType) => {
		if (preprocessItem !== undefined) {
			data = preprocessItem(data) as PostType
		}
		axios.post(`${API_URL}${entityPath}`, data, { withCredentials: true }).catch(addError)
	}, [preprocessItem, API_URL, entityPath, addError])

	const createEntityAsync = useCallback(async (data: PostType) => {
		if (preprocessItem !== undefined) {
			data = preprocessItem(data) as PostType
		}
		const response = await axios.post<ReturnType>(`${API_URL}${entityPath}`, data, { withCredentials: true })
		return response.data
	}, [preprocessItem, API_URL, entityPath])

	const updateEntity = useCallback((id: string, data: PatchType) => {
		if (preprocessItem !== undefined) {
			data = preprocessItem(data) as PatchType
		}
		axios.patch(`${API_URL}${entityPath}/${id}`, data, { withCredentials: true }).catch(addError)
	}, [preprocessItem, API_URL, entityPath, addError])

	const updateEntityAsync = useCallback(async (id: string, data: PatchType) => {
		if (preprocessItem !== undefined) {
			data = preprocessItem(data) as PatchType
		}
		const response = await axios.patch<ReturnType>(`${API_URL}${entityPath}/${id}`, data, { withCredentials: true })
		return response.data
	}, [preprocessItem, API_URL, entityPath])

	const deleteEntity = useCallback((id: string, confirm: boolean) => {
		axios.delete(`${API_URL}${entityPath}/${id}`, {
			data: { confirm },
			withCredentials: true
		}).catch(addError)
	}, [API_URL, entityPath, addError])

	return {
		createEntity,
		updateEntity,
		deleteEntity,
		createEntityAsync,
		updateEntityAsync
	}
}

export default useCUDOperations
