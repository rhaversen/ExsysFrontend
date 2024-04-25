import React from 'react'

const SubmitButton = ({ onClick }: { onClick: () => void }) => {
	return (
		<div className="flex items-center justify-center flex-grow p-5">
			<button
				type="submit"
				className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-10 rounded m-0"
				onClick={onClick}
			>
				Bestil
			</button>
		</div>
	)
}

export default SubmitButton
