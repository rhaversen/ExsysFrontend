import React from 'react'

const SubmitButton = ({ onClick }: { onClick: () => void }) => {
	return (
		<button
			type="submit"
			className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			onClick={onClick}
		>
			Færdiggør Bestilling
		</button>
	)
}

export default SubmitButton
