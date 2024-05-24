import React, { type ReactElement } from 'react'

const ValidationErrorWindow = ({
	message
}: {
	message: string
}): ReactElement => {
	return (
		<div className="absolute transform translate-x-1/2 not-italic z-10">
			<div
				className="absolute w-2 h-2 bg-red-800 transform rotate-45 translate-y-full rounded-bl-sm -translate-x-1"
			/>
			<div className="rounded-md px-2 bg-red-800 text-white font-bold">
				{message}
			</div>
		</div>
	)
}

export default ValidationErrorWindow
