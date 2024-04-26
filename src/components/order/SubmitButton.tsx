import React from 'react'

const SubmitButton = ({
	onClick,
	disabled
}: {
	onClick: () => void,
	disabled: boolean
}) => {
	return (
		<div className="flex items-center justify-center flex-grow p-5">
			<button
				type="submit"
				className={`font-bold py-2 px-20 rounded m-0 text-white
				${disabled
			? 'bg-blue-400 hover:bg-blue-400 cursor-not-allowed'
			: 'bg-blue-500 hover:bg-blue-700 cursor-auto'}
				`}
				onClick={onClick}
				disabled={disabled}
			>
				Bestil
			</button>
		</div>
	)
}

export default SubmitButton
