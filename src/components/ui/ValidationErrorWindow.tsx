import React, { type ReactElement } from 'react'

const ValidationErrorWindow = ({
	messages
}: {
	messages: string[]
}): ReactElement => {
	return (
		<div className="pt-1 fixed transform translate-y-full not-italic z-10">
			<div className="px-1 rounded-md bg-red-800 text-white font-bold flex flex-col">
				{messages.map((message, i) => (
					<p key={i + message} className="text-sm">
						{message}
					</p>
				))}
			</div>
		</div>
	)
}

export default ValidationErrorWindow
