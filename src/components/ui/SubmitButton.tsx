import React, { type ReactElement } from 'react'

const SubmitButton = ({
	text,
	onClick,
	disabled
}: {
	text: string
	onClick: () => void
	disabled: boolean
}): ReactElement => {
	return (
		<div className="flex justify-center p-5">
			<button
				type="submit"
				className={`font-bold py-5 px-40 rounded m-0 text-white 
				${disabled
			? 'bg-blue-400 hover:bg-blue-400 cursor-not-allowed'
			: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 cursor-pointer'}
				`}
				onClick={onClick}
				disabled={disabled}
			>
				{text}
			</button>
		</div>
	)
}

export default SubmitButton
