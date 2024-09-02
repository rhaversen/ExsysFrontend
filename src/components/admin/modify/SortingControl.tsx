'use client'

import { sortConfig } from '@/types/frontendDataTypes'
import { type ReactElement } from 'react'

const SortingControl = ({
	type,
	onSortFieldChange,
	onSortDirectionChange
}: {
	type: keyof typeof sortConfig
	onSortFieldChange: (sortField: string) => void
	onSortDirectionChange: (sortDirection: string) => void

}): ReactElement => {
	return (
		<div className="absolute right-0 text-black flex flex-col items-center">
			<p className="m-2">Sorter efter:</p>
			<div className="flex justify-center items-center">
				<select
					className="mx-2 rounded-md text-center"
					onChange={(e) => { onSortFieldChange(e.target.value) }}
					title="Sorteringsfelt"
					defaultValue={sortConfig[type][0].prop}
				>
					{sortConfig[type].map(prop => (
						<option key={prop.prop} value={prop.prop}>{prop.name}</option>
					))}
				</select>
				<select
					className="mx-2 rounded-sm text-center"
					onChange={(e) => { onSortDirectionChange(e.target.value) }}
					title="Sorteringsretning"
					defaultValue={'asc'}
				>
					<option value="asc">
						{'Stigende'}
					</option>
					<option value="desc">
						{'Aftagende'}
					</option>
				</select>
			</div>
		</div>
	)
}

export default SortingControl
