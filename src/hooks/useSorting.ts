import { useState, useEffect } from 'react'

import sortConfig from '@/lib/SortConfig'
import { sortProductsByOrderWindowFrom, sortProductsByOrderWindowTo } from '@/lib/timeUtils'
import { type ProductType } from '@/types/backendDataTypes'

export default function useSorting (type: keyof typeof sortConfig | null) {
	// Default field is first field of first category in sortConfig
	// const defaultField = sortConfig[Object.keys(sortConfig)[0] as keyof typeof sortConfig][0].prop
	const [sortField, setSortField] = useState('createdAt')
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

	// reset to default on type change
	useEffect(() => {
		setSortField('createdAt')
		setSortDirection('desc')
	}, [type])

	// If no type provided, return inactive sorting state
	if (type === null) {
		return {
			sortField,
			setSortField,
			sortDirection,
			setSortDirection,
			sortByField: <U>(items: U[]): U[] => items,
			sortingOptions: [],
			isEnabled: false
		}
	}

	// Get available fields for this type
	const sortingOptions = sortConfig[type]

	const resolveProperty = (obj: unknown, path: string): unknown => {
		return path.split('.').reduce((acc, part) => (acc != null && typeof acc === 'object') ? (acc as Record<string, unknown>)[part] : undefined, obj)
	}

	const compareStrings = (strA: string, strB: string): number => {
		const lowerStrA = strA.toLowerCase()
		const lowerStrB = strB.toLowerCase()
		if (lowerStrA < lowerStrB) { return sortDirection === 'asc' ? -1 : 1 }
		if (lowerStrA > lowerStrB) { return sortDirection === 'asc' ? 1 : -1 }
		return 0
	}

	const compareValues = (valA: unknown, valB: unknown): number => {
		if (typeof valA === 'string' && typeof valB === 'string') {
			return compareStrings(valA, valB)
		}
		if (typeof valA === 'number' && typeof valB === 'number') {
			return sortDirection === 'asc'
				? (valA > valB ? 1 : -1)
				: (valA < valB ? 1 : -1)
		}
		if (valA instanceof Date && valB instanceof Date) {
			return sortDirection === 'asc'
				? (valA.getTime() > valB.getTime() ? 1 : -1)
				: (valA.getTime() < valB.getTime() ? 1 : -1)
		}
		// fallback: convert to string and compare
		return compareStrings(String(valA), String(valB))
	}

	const sortByField = <U>(items: U[]): U[] => {
		if (sortField === 'orderWindow.from.hour') {
			const sorted = sortProductsByOrderWindowFrom([...items as ProductType[]])
			return (sortDirection === 'asc' ? sorted : sorted.reverse()) as U[]
		}
		if (sortField === 'orderWindow.to.hour') {
			const sorted = sortProductsByOrderWindowTo([...items as ProductType[]])
			return sortDirection === 'asc' ? (sorted as U[]) : (sorted.reverse() as U[])
		}
		return items.slice().sort((a, b) => {
			const valA = resolveProperty(a, sortField)
			const valB = resolveProperty(b, sortField)
			return compareValues(valA, valB)
		})
	}

	return {
		sortField,
		setSortField,
		sortDirection,
		setSortDirection,
		sortByField,
		sortingOptions,
		isEnabled: type !== null
	}
}
