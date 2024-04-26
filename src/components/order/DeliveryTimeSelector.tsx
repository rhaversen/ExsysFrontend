import React, { useState, useEffect } from 'react'

const DeliveryTimeSelector = ({
	selectedDate,
	onDateSelect
}: {
	selectedDate: Date
	onDateSelect: (date: Date) => void
}) => {
	const [options, setOptions] = useState<Date[]>([])

	const handleTimeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedTime = new Date(event.target.value)
		onDateSelect(selectedTime)
		console.log(selectedTime)
	}

	const formatTime = (date: Date) => {
		const hours = date.getHours().toString().padStart(2, '0')
		const minutes = date.getMinutes().toString().padStart(2, '0')
		return `${hours}:${minutes}`
	}

	// Populate options with an array of dates
	useEffect(() => {
		const now = new Date()
		const nextInterval = new Date(Math.ceil(now.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000))
		const options = []
		for (let i = 0; i < 24 * 4; i++) {
			const hours = Math.floor(i / 4)
			const minutes = (i % 4) * 15
			const optionTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
			if (optionTime.getTime() >= nextInterval.getTime()) {
				options.push(optionTime)
			}
		}
		setOptions(options)
	}, [])

	return (
		<div className="p-5">
			<select
				aria-label="Vælg tidspunkt"
				className="p-5 border bg-blue-500 rounded-md shadow-sm text-white focus:outline-none cursor-pointer"
				value={selectedDate.toISOString()}
				onChange={handleTimeChange}
			>
				{options.map((date) => {
					return (
						<option key={date.toISOString()} value={date.toISOString()} className="bg-white text-black">
							{formatTime(date)}
						</option>
					)
				})}
			</select>
		</div>
	)
}

export default DeliveryTimeSelector