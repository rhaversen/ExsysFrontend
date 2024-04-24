import React from 'react'

type SubmitButtonProps = {
	onClick: () => void;
};

const SubmitButton: React.FC<SubmitButtonProps> = ({ onClick }) => {
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
