import { type ReactElement } from 'react'

const QuantityAdjustButton = ({
	onClick,
	text,
	disabled
}: {
	onClick: () => void
	text: string
	disabled: boolean
}): ReactElement => {
	return (
		<button
			type="button"
			className={`w-10 h-10 bg-transparent border-2 font-bold rounded-full flex justify-center items-center
			${disabled
			? 'border-gray-400 text-gray-400 cursor-not-allowed'
			: 'border-blue-500 text-blue-500'}
			`}
			onClick={onClick}
			disabled={disabled}
		>
			{text}
		</button>
	)
}

export default QuantityAdjustButton
