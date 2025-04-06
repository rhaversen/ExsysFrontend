import { AdminImages } from '@/lib/images'
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
		<div className="flex items-start gap-3">
			<div className="text-xs text-gray-500 flex items-center"
				title="Oprettet"
			>
				<Image
					className="h-4 w-4"
					src={AdminImages.created.src}
					alt={AdminImages.created.alt}
					width={10}
					height={10}
				/>
				<span>{created}</span>
			</div>
			{createdAt !== updatedAt && (
				<div className="text-xs text-gray-500 flex items-center"
					title="Opdateret"
				>
					<Image
						className="h-4 w-4"
						src={AdminImages.updated.src}
						alt={AdminImages.updated.alt}
						width={10}
						height={10}
					/>
					<span>{updated}</span>
				</div>
			)}
		</div>
	)
}

export default Timestamps
