import { type ActivityType } from '@/types/backendDataTypes'
import Image from 'next/image'
import React, { type ReactElement } from 'react'
import { AdminImages } from '@/lib/images'

const Option = ({
	activity,
	editable,
	onDelete
}: {
	activity: ActivityType
	editable: boolean
	onDelete: (v: ActivityType) => void
}): ReactElement => {
	return (
		<div className="flex items-center justify-between w-auto bg-gray-200 text-gray-800 m-1 rounded-full px-2 py-1">
			<p className="text-center text-sm font-semibold">{activity.name}</p>
			{editable && (
				<button
					type="button"
					className="cursor-pointer"
					onClick={() => {
						onDelete(activity)
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
