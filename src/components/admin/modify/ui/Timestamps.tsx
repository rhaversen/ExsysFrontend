import Image from 'next/image'
import React, { type ReactElement } from 'react'

const Timestamps = ({
	createdAt,
	updatedAt
}: {
	createdAt: string
	updatedAt: string
}): ReactElement => {
	const currentDate = new Date()
	const currentYear = currentDate.getFullYear()

	const createdDate = new Date(createdAt)
	const updatedDate = new Date(updatedAt)

	const isCreatedToday = createdDate.toDateString() === currentDate.toDateString()
	const isUpdatedToday = updatedDate.toDateString() === currentDate.toDateString()

	const formatDate = (date: Date): string => {
		let dateStr = date.toLocaleDateString('da-DK', {
			day: 'numeric',
			month: 'long'
		})
		if (date.getFullYear() !== currentYear) {
			dateStr += ` ${date.getFullYear()}`
		}
		return dateStr
	}

	const formatTime = (date: Date): string => 'i dag ' + date.toLocaleTimeString('da-DK', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: false
	})

	const created = isCreatedToday ? formatTime(createdDate) : formatDate(createdDate)
	const updated = isUpdatedToday ? formatTime(updatedDate) : formatDate(updatedDate)

	return (
		<div className="flex flex-col items-center">
			<div className="text-sm text-gray-600 flex flex-row items-center">
				<Image
					className="h-7 w-7 p-1 mx-1"
					src="admin/created.svg"
					alt="Oprettet"
					width={10}
					height={10}
				/>
				{created}
			</div>
			{createdAt !== updatedAt && (
				<div className="text-sm text-gray-600 flex flex-row items-center">
					<Image
						className="h-7 w-7 p-1 mx-1"
						src="admin/updated.svg"
						alt="Opdateret"
						width={10}
						height={10}
					/>
					{updated}
				</div>
			)}
		</div>
	)
}

export default Timestamps
