'use client'

import { type ReactElement, useEffect, useRef, useState } from 'react'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'

const SortingControl = ({
	options,
	currentField,
	currentDirection,
	onSortFieldChange,
	onSortDirectionChange
}: {
	options: Array<{ prop: string, label: string }>
	currentField: string
	currentDirection: 'asc' | 'desc'
	onSortFieldChange: (field: string) => void
	onSortDirectionChange: (direction: 'asc' | 'desc') => void
}): ReactElement => {
	const [dropdownOpen, setDropdownOpen] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent): void => {
			if ((dropdownRef.current !== null) && !dropdownRef.current.contains(event.target as Node)) {
				setDropdownOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	return (
		<div className="relative w-80 text-black" ref={dropdownRef}>
			<button
				onClick={() => { setDropdownOpen(!dropdownOpen) }}
				className="w-full bg-white px-4 py-2 rounded-md focus:outline-none flex items-center justify-between"
				type="button"
			>
				{'Sorter efter'}
				<span>
					{dropdownOpen ? <FaChevronUp className="w-4 h-4" /> : <FaChevronDown className="w-4 h-4" />}
				</span>
			</button>
			<div
				className={`absolute w-full bg-white p-4 rounded-md shadow-lg mt-2 transform transition-all duration-200 ${
					dropdownOpen
						? 'opacity-100 scale-100'
						: 'opacity-0 scale-95 pointer-events-none'
				}`}
			>
				<div className="flex flex-col gap-2">
					<select
						className="w-full rounded-md text-center px-4 py-1.5 border bg-white cursor-pointer"
						onChange={(e) => { onSortFieldChange(e.target.value) }}
						title="Sorteringsfelt"
						value={currentField}
					>
						{options.map(prop => (
							<option key={prop.prop} value={prop.prop}>{prop.label}</option>
						))}
					</select>
					<select
						className="w-full rounded-md text-center px-4 py-1.5 border bg-white cursor-pointer"
						onChange={(e) => { onSortDirectionChange(e.target.value as 'asc' | 'desc') }}
						title="Sorteringsretning"
						value={currentDirection}
					>
						<option value="asc">{'Stigende'}</option>
						<option value="desc">{'Aftagende'}</option>
					</select>
				</div>
			</div>
		</div>
	)
}

export default SortingControl
