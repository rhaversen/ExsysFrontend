import sortConfig from '@/lib/SortConfig'
import { useState } from 'react'

export default function useSorting (type: keyof typeof sortConfig | null): {
	sortField: string
	setSortField: (field: string) => void
	sortDirection: 'asc' | 'desc'
	setSortDirection: (direction: 'asc' | 'desc') => void
	sortByField: (items: any[]) => any[]
	sortingOptions: Array<{ prop: string, label: string }>
	isEnabled: boolean
} {
	// Default field is first field of first category in sortConfig
	const defaultField = sortConfig[Object.keys(sortConfig)[0] as keyof typeof sortConfig][0].prop
	const [sortField, setSortField] = useState(defaultField)
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

	// If no type provided, return inactive sorting state
	if (type === null) {
		return {
			sortField,
			setSortField,
			sortDirection,
			setSortDirection,
			sortByField: (items) => items,
			sortingOptions: [],
			isEnabled: false
		}
	}

	// Get available fields for this type
	const sortingOptions = sortConfig[type]

	const resolveProperty = (obj: any, path: string): any => {
		return path.split('.').reduce((acc, part) => acc != null ? acc[part] : undefined, obj)
	}

	const compareStrings = (strA: string, strB: string): number => {
		const lowerStrA = strA.toLowerCase()
		const lowerStrB = strB.toLowerCase()
		if (lowerStrA < lowerStrB) return sortDirection === 'asc' ? -1 : 1
		if (lowerStrA > lowerStrB) return sortDirection === 'asc' ? 1 : -1
		return 0
	}

	const compareValues = (valA: any, valB: any): number => {
		if (typeof valA === 'string' && typeof valB === 'string') {
			return compareStrings(valA, valB)
		}
		return sortDirection === 'asc'
			? (valA > valB ? 1 : -1)
			: (valA < valB ? 1 : -1)
	}

	const sortByField = (items: any[]): any[] => {
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
		isEnabled: true
	}
}
