import { useCallback } from 'react'
import axios from 'axios'
import { useError } from '@/contexts/ErrorContext/ErrorContext'

const useCUDOperations = <PostType, PatchType>(entityPath: string): {
	createEntity: (data: PostType) => void
	updateEntity: (id: string, data: PatchType) => void
	deleteEntity: (id: string, confirm: boolean) => void
} => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const { addError } = useError()

	const createEntity = useCallback((data: PostType) => {
		axios.post(`${API_URL}${entityPath}`, data, { withCredentials: true }).catch(addError)
	}, [API_URL, entityPath, addError])

	const updateEntity = useCallback((id: string, data: PatchType) => {
		axios.patch(`${API_URL}${entityPath}/${id}`, data, { withCredentials: true }).catch(addError)
	}, [API_URL, entityPath, addError])

	const deleteEntity = useCallback((id: string, confirm: boolean) => {
		axios.delete(`${API_URL}${entityPath}/${id}`, {
			data: { confirm },
			withCredentials: true
		}).catch(addError)
	}, [API_URL, entityPath, addError])

	return { createEntity, updateEntity, deleteEntity }
}

export default useCUDOperations
