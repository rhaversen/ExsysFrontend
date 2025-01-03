import { type OptionType } from '@/types/backendDataTypes'
import Image from 'next/image'
import React, { type ReactElement } from 'react'
import { AdminImages } from '@/lib/images'

const Option = ({
	option,
	editable,
	onDelete
}: {
	option: OptionType
	editable: boolean
	onDelete: (v: OptionType) => void
}): ReactElement => {
	return (
		<div className="flex items-center justify-between w-auto bg-gray-200 text-gray-800 m-1 rounded-full px-2 py-1">
			<p className="text-center text-sm font-semibold">{option.name}</p>
			{editable && (
				<button
					type="button"
					title="Fjern"
					className="cursor-pointer"
					onClick={() => {
						onDelete(option)
					}}
				>
					<p className="sr-only">{'Delete'}</p>
					<Image
						src={AdminImages.delete.src}
						alt={AdminImages.delete.alt}
						width={15}
						height={15}
					/>
				</button>
			)}
		</div>
	)
}

export default Option
